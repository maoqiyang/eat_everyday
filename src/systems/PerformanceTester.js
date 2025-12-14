import Phaser from 'phaser'

// 性能测试配置
const PERFORMANCE_CONFIG = {
    // 采样间隔（毫秒）
    sampleInterval: 1000,
    // 测试持续时间（毫秒）
    testDuration: 60000,
    // 性能指标阈值
    thresholds: {
        // FPS阈值
        fps: {
            good: 55,
            fair: 45,
            poor: 30
        },
        // 内存使用阈值（MB）
        memory: {
            warning: 100,
            critical: 150
        },
        // 渲染时间阈值（毫秒）
        renderTime: {
            good: 10,
            fair: 15,
            poor: 20
        }
    },
    // 记录数据的最大样本数
    maxSamples: 60
}

// 性能测试场景类型
export const TestSceneType = {
    // 空场景测试
    EMPTY_SCENE: 'EMPTY_SCENE',
    // 基础渲染测试
    BASIC_RENDER: 'BASIC_RENDER',
    // 物理系统测试
    PHYSICS_TEST: 'PHYSICS_TEST',
    // 大量对象测试
    MANY_OBJECTS: 'MANY_OBJECTS',
    // 特效测试
    EFFECTS_TEST: 'EFFECTS_TEST',
    // 完整游戏场景测试
    FULL_GAME: 'FULL_GAME'
}

// 性能测试器类
export class PerformanceTester {
    constructor(game) {
        this.game = game
        this.isTesting = false
        this.isRecording = false
        this.testStartTime = 0
        this.currentTest = null
        this.performanceData = {
            fps: [],
            memory: [],
            renderTime: [],
            physicsTime: [],
            updateTime: [],
            objectsCount: [],
            drawCalls: []
        }
        this.testResults = {}
        this.sampleTimer = null
        this.testCompleteCallback = null
        
        // 初始化性能测试器
        this.init()
    }

    init() {
        // 注册性能测试场景
        this.registerTestScenes()
        
        // 创建性能监控UI
        this.createPerformanceUI()
        
        // 默认隐藏性能UI
        this.togglePerformanceUI(false)
    }

    registerTestScenes() {
        // 注册各种性能测试场景
        this.game.scene.add(TestSceneType.EMPTY_SCENE, EmptySceneTest)
        this.game.scene.add(TestSceneType.BASIC_RENDER, BasicRenderTest)
        this.game.scene.add(TestSceneType.PHYSICS_TEST, PhysicsSystemTest)
        this.game.scene.add(TestSceneType.MANY_OBJECTS, ManyObjectsTest)
        this.game.scene.add(TestSceneType.EFFECTS_TEST, EffectsTest)
        this.game.scene.add(TestSceneType.FULL_GAME, FullGameTest)
    }

    createPerformanceUI() {
        // 创建性能监控UI容器
        this.performanceUIContainer = this.game.add.container(10, 10)
        this.performanceUIContainer.setDepth(10000)
        
        // 创建背景面板
        this.performanceUIPanel = this.game.add.rectangle(
            0,
            0,
            300,
            150,
            0x000000,
            0.7
        )
        this.performanceUIPanel.setStrokeStyle(1, 0xFFFFFF, 0.5)
        this.performanceUIPanel.setOrigin(0, 0)
        
        // 创建FPS文本
        this.fpsText = this.game.add.text(
            10,
            10,
            'FPS: 0',
            { fontSize: '12px', color: '#00FF00' }
        )
        this.fpsText.setOrigin(0, 0)
        
        // 创建内存使用文本
        this.memoryText = this.game.add.text(
            10,
            30,
            '内存: 0 MB',
            { fontSize: '12px', color: '#00FF00' }
        )
        this.memoryText.setOrigin(0, 0)
        
        // 创建渲染时间文本
        this.renderTimeText = this.game.add.text(
            10,
            50,
            '渲染时间: 0 ms',
            { fontSize: '12px', color: '#00FF00' }
        )
        this.renderTimeText.setOrigin(0, 0)
        
        // 创建物理时间文本
        this.physicsTimeText = this.game.add.text(
            10,
            70,
            '物理时间: 0 ms',
            { fontSize: '12px', color: '#00FF00' }
        )
        this.physicsTimeText.setOrigin(0, 0)
        
        // 创建对象数量文本
        this.objectsCountText = this.game.add.text(
            10,
            90,
            '对象数量: 0',
            { fontSize: '12px', color: '#00FF00' }
        )
        this.objectsCountText.setOrigin(0, 0)
        
        // 创建绘制调用文本
        this.drawCallsText = this.game.add.text(
            10,
            110,
            '绘制调用: 0',
            { fontSize: '12px', color: '#00FF00' }
        )
        this.drawCallsText.setOrigin(0, 0)
        
        // 添加到容器
        this.performanceUIContainer.add(this.performanceUIPanel)
        this.performanceUIContainer.add(this.fpsText)
        this.performanceUIContainer.add(this.memoryText)
        this.performanceUIContainer.add(this.renderTimeText)
        this.performanceUIContainer.add(this.physicsTimeText)
        this.performanceUIContainer.add(this.objectsCountText)
        this.performanceUIContainer.add(this.drawCallsText)
        
        // 添加测试状态文本
        this.testStatusText = this.game.add.text(
            10,
            this.game.config.height - 30,
            '性能测试: 未运行',
            { fontSize: '12px', color: '#FF0000' }
        )
        this.testStatusText.setOrigin(0, 0)
        this.performanceUIContainer.add(this.testStatusText)
    }

    togglePerformanceUI(show) {
        if (this.performanceUIContainer) {
            this.performanceUIContainer.setVisible(show)
        }
    }

    // 开始性能测试
    startPerformanceTest(testSceneType, duration = PERFORMANCE_CONFIG.testDuration, callback = null) {
        // 如果已经在测试中，先停止
        if (this.isTesting) {
            this.stopPerformanceTest()
        }
        
        this.isTesting = true
        this.isRecording = true
        this.currentTest = testSceneType
        this.testDuration = duration
        this.testCompleteCallback = callback
        
        // 重置性能数据
        this.resetPerformanceData()
        
        // 记录测试开始时间
        this.testStartTime = Date.now()
        
        // 启动性能数据采样
        this.startSampling()
        
        // 显示性能UI
        this.togglePerformanceUI(true)
        
        // 更新测试状态
        this.updateTestStatusText(`性能测试: 运行中 (${testSceneType})`)
        
        // 启动测试场景
        this.game.scene.start(testSceneType)
        
        // 设置测试结束定时器
        this.game.time.delayedCall(this.testDuration, () => {
            this.stopPerformanceTest()
        })
        
        console.log(`性能测试已启动: ${testSceneType}, 持续时间: ${this.testDuration}ms`)
    }

    // 停止性能测试
    stopPerformanceTest() {
        if (!this.isTesting) {
            return
        }
        
        this.isTesting = false
        this.isRecording = false
        
        // 停止采样
        this.stopSampling()
        
        // 计算测试结果
        this.calculateTestResults()
        
        // 更新测试状态
        this.updateTestStatusText(`性能测试: 已完成 (${this.currentTest})`)
        
        console.log(`性能测试已完成: ${this.currentTest}`)
        console.log('测试结果:', this.testResults)
        
        // 生成并保存测试报告
        const report = this.generateTestReport()
        this.saveTestReport(report)
        
        // 调用完成回调
        if (typeof this.testCompleteCallback === 'function') {
            this.testCompleteCallback(this.testResults, report)
        }
        
        // 返回主场景
        this.game.scene.stop(this.currentTest)
        this.game.scene.start('START')
    }

    // 开始采样性能数据
    startSampling() {
        // 清除之前的定时器
        if (this.sampleTimer) {
            this.game.time.removeEvent(this.sampleTimer)
        }
        
        // 创建新的采样定时器
        this.sampleTimer = this.game.time.addEvent({
            delay: PERFORMANCE_CONFIG.sampleInterval,
            callback: this.samplePerformanceData, 
            callbackScope: this,
            repeat: -1
        })
    }

    // 停止采样性能数据
    stopSampling() {
        if (this.sampleTimer) {
            this.game.time.removeEvent(this.sampleTimer)
            this.sampleTimer = null
        }
    }

    // 采样性能数据
    samplePerformanceData() {
        if (!this.isRecording) {
            return
        }
        
        // 获取FPS
        const fps = this.game.loop.actualFps
        this.performanceData.fps.push(fps)
        
        // 获取内存使用情况（如果浏览器支持）
        let memoryMB = 0
        if (window.performance && window.performance.memory) {
            memoryMB = Math.round(window.performance.memory.usedJSHeapSize / 1024 / 1024)
        }
        this.performanceData.memory.push(memoryMB)
        
        // 获取渲染时间（如果游戏引擎支持）
        const renderTime = this.game.renderer.info.renderTime || 0
        this.performanceData.renderTime.push(renderTime)
        
        // 获取物理处理时间（如果使用了物理引擎）
        let physicsTime = 0
        if (this.game.physics && this.game.physics.world && this.game.physics.world.time) {
            physicsTime = this.game.physics.world.time
        }
        this.performanceData.physicsTime.push(physicsTime)
        
        // 获取更新时间
        const updateTime = this.game.loop.delta / 1000
        this.performanceData.updateTime.push(updateTime)
        
        // 获取对象数量
        let objectsCount = 0
        const currentScene = this.game.scene.getScenes(true)[0]
        if (currentScene && currentScene.children) {
            objectsCount = currentScene.children.size
        }
        this.performanceData.objectsCount.push(objectsCount)
        
        // 获取绘制调用次数
        const drawCalls = this.game.renderer.info.drawCalls || 0
        this.performanceData.drawCalls.push(drawCalls)
        
        // 更新性能UI
        this.updatePerformanceUI()
        
        // 限制样本数量
        this.limitPerformanceDataSamples()
    }

    // 限制性能数据样本数量
    limitPerformanceDataSamples() {
        Object.keys(this.performanceData).forEach(key => {
            if (this.performanceData[key].length > PERFORMANCE_CONFIG.maxSamples) {
                this.performanceData[key].shift()
            }
        })
    }

    // 更新性能UI
    updatePerformanceUI() {
        if (!this.performanceUIContainer || !this.performanceUIContainer.visible) {
            return
        }
        
        // 获取最新的性能数据
        const latestFps = this.performanceData.fps[this.performanceData.fps.length - 1] || 0
        const latestMemory = this.performanceData.memory[this.performanceData.memory.length - 1] || 0
        const latestRenderTime = this.performanceData.renderTime[this.performanceData.renderTime.length - 1] || 0
        const latestPhysicsTime = this.performanceData.physicsTime[this.performanceData.physicsTime.length - 1] || 0
        const latestObjectsCount = this.performanceData.objectsCount[this.performanceData.objectsCount.length - 1] || 0
        const latestDrawCalls = this.performanceData.drawCalls[this.performanceData.drawCalls.length - 1] || 0
        
        // 更新FPS文本和颜色
        this.fpsText.setText(`FPS: ${Math.round(latestFps)}`)
        this.fpsText.setColor(this.getPerformanceColor(latestFps, PERFORMANCE_CONFIG.thresholds.fps))
        
        // 更新内存文本和颜色
        this.memoryText.setText(`内存: ${latestMemory} MB`)
        if (latestMemory > PERFORMANCE_CONFIG.thresholds.memory.critical) {
            this.memoryText.setColor('#FF0000')
        } else if (latestMemory > PERFORMANCE_CONFIG.thresholds.memory.warning) {
            this.memoryText.setColor('#FF9800')
        } else {
            this.memoryText.setColor('#00FF00')
        }
        
        // 更新渲染时间文本和颜色
        this.renderTimeText.setText(`渲染时间: ${latestRenderTime.toFixed(2)} ms`)
        this.renderTimeText.setColor(this.getPerformanceColor(latestRenderTime, PERFORMANCE_CONFIG.thresholds.renderTime, true))
        
        // 更新物理时间文本
        this.physicsTimeText.setText(`物理时间: ${latestPhysicsTime.toFixed(2)} ms`)
        
        // 更新对象数量文本
        this.objectsCountText.setText(`对象数量: ${latestObjectsCount}`)
        
        // 更新绘制调用文本
        this.drawCallsText.setText(`绘制调用: ${latestDrawCalls}`)
    }

    // 获取性能指标颜色
    getPerformanceColor(value, thresholds, isLowerBetter = false) {
        if (isLowerBetter) {
            if (value <= thresholds.good) {
                return '#00FF00'
            } else if (value <= thresholds.fair) {
                return '#FF9800'
            } else if (value <= thresholds.poor) {
                return '#FFC107'
            } else {
                return '#FF0000'
            }
        } else {
            if (value >= thresholds.good) {
                return '#00FF00'
            } else if (value >= thresholds.fair) {
                return '#FF9800'
            } else if (value >= thresholds.poor) {
                return '#FFC107'
            } else {
                return '#FF0000'
            }
        }
    }

    // 更新测试状态文本
    updateTestStatusText(text) {
        if (this.testStatusText) {
            this.testStatusText.setText(text)
        }
    }

    // 重置性能数据
    resetPerformanceData() {
        this.performanceData = {
            fps: [],
            memory: [],
            renderTime: [],
            physicsTime: [],
            updateTime: [],
            objectsCount: [],
            drawCalls: []
        }
        this.testResults = {}
    }

    // 计算测试结果
    calculateTestResults() {
        // 计算FPS统计数据
        this.testResults.fps = this.calculateStatistics(this.performanceData.fps)
        
        // 计算内存统计数据
        this.testResults.memory = this.calculateStatistics(this.performanceData.memory)
        
        // 计算渲染时间统计数据
        this.testResults.renderTime = this.calculateStatistics(this.performanceData.renderTime)
        
        // 计算物理时间统计数据
        this.testResults.physicsTime = this.calculateStatistics(this.performanceData.physicsTime)
        
        // 计算更新时间统计数据
        this.testResults.updateTime = this.calculateStatistics(this.performanceData.updateTime)
        
        // 计算对象数量统计数据
        this.testResults.objectsCount = this.calculateStatistics(this.performanceData.objectsCount)
        
        // 计算绘制调用统计数据
        this.testResults.drawCalls = this.calculateStatistics(this.performanceData.drawCalls)
        
        // 计算总体性能评分
        this.testResults.overallScore = this.calculateOverallScore()
        
        // 添加测试信息
        this.testResults.testInfo = {
            testType: this.currentTest,
            testDuration: this.testDuration,
            date: new Date().toISOString(),
            browser: navigator.userAgent,
            screen: `${window.screen.width}x${window.screen.height}`,
            devicePixelRatio: window.devicePixelRatio
        }
    }

    // 计算统计数据
    calculateStatistics(dataArray) {
        if (!dataArray || dataArray.length === 0) {
            return { average: 0, min: 0, max: 0, median: 0, variance: 0, stdDev: 0 }
        }
        
        // 排序数据
        const sortedData = [...dataArray].sort((a, b) => a - b)
        
        // 计算总和
        const sum = sortedData.reduce((acc, val) => acc + val, 0)
        
        // 计算平均值
        const average = sum / sortedData.length
        
        // 计算最小值和最大值
        const min = sortedData[0]
        const max = sortedData[sortedData.length - 1]
        
        // 计算中位数
        let median = 0
        const middle = Math.floor(sortedData.length / 2)
        if (sortedData.length % 2 === 0) {
            median = (sortedData[middle - 1] + sortedData[middle]) / 2
        } else {
            median = sortedData[middle]
        }
        
        // 计算方差和标准差
        const variance = sortedData.reduce((acc, val) => acc + Math.pow(val - average, 2), 0) / sortedData.length
        const stdDev = Math.sqrt(variance)
        
        return {
            average: parseFloat(average.toFixed(2)),
            min: parseFloat(min.toFixed(2)),
            max: parseFloat(max.toFixed(2)),
            median: parseFloat(median.toFixed(2)),
            variance: parseFloat(variance.toFixed(4)),
            stdDev: parseFloat(stdDev.toFixed(4))
        }
    }

    // 计算总体性能评分
    calculateOverallScore() {
        let score = 0
        
        // FPS评分（占40%）
        const fpsScore = this.calculateMetricScore(
            this.testResults.fps.average,
            PERFORMANCE_CONFIG.thresholds.fps,
            false
        )
        score += fpsScore * 0.4
        
        // 渲染时间评分（占30%）
        const renderScore = this.calculateMetricScore(
            this.testResults.renderTime.average,
            PERFORMANCE_CONFIG.thresholds.renderTime,
            true
        )
        score += renderScore * 0.3
        
        // 内存使用评分（占15%）
        let memoryScore = 100
        if (this.testResults.memory.average > PERFORMANCE_CONFIG.thresholds.memory.critical) {
            memoryScore = 30
        } else if (this.testResults.memory.average > PERFORMANCE_CONFIG.thresholds.memory.warning) {
            memoryScore = 70
        }
        score += memoryScore * 0.15
        
        // 稳定性评分（标准差，占15%）
        const stabilityScore = Math.max(0, 100 - this.testResults.fps.stdDev * 5)
        score += stabilityScore * 0.15
        
        return Math.round(score)
    }

    // 计算单个指标的评分
    calculateMetricScore(value, thresholds, isLowerBetter = false) {
        if (isLowerBetter) {
            if (value <= thresholds.good) {
                return 100
            } else if (value <= thresholds.fair) {
                return 80 - ((value - thresholds.good) / (thresholds.fair - thresholds.good)) * 20
            } else if (value <= thresholds.poor) {
                return 60 - ((value - thresholds.fair) / (thresholds.poor - thresholds.fair)) * 30
            } else {
                return 30 - ((value - thresholds.poor) / 10) * 30
            }
        } else {
            if (value >= thresholds.good) {
                return 100
            } else if (value >= thresholds.fair) {
                return 80 - ((thresholds.good - value) / (thresholds.good - thresholds.fair)) * 20
            } else if (value >= thresholds.poor) {
                return 60 - ((thresholds.fair - value) / (thresholds.fair - thresholds.poor)) * 30
            } else {
                return 30 - ((thresholds.poor - value) / 10) * 30
            }
        }
    }

    // 生成测试报告
    generateTestReport() {
        const report = {
            title: '火柴人攀爬100层楼 - 性能测试报告',
            date: new Date().toLocaleString(),
            testType: this.currentTest,
            testDuration: `${(this.testDuration / 1000).toFixed(1)}秒`,
            environment: {
                browser: navigator.userAgent,
                screenResolution: `${window.screen.width}x${window.screen.height}`,
                devicePixelRatio: window.devicePixelRatio,
                platform: navigator.platform,
                language: navigator.language
            },
            performanceMetrics: {
                fps: {
                    average: `${this.testResults.fps.average.toFixed(2)} FPS`,
                    min: `${this.testResults.fps.min.toFixed(2)} FPS`,
                    max: `${this.testResults.fps.max.toFixed(2)} FPS`,
                    stability: `±${this.testResults.fps.stdDev.toFixed(2)} FPS`
                },
                memory: {
                    average: `${this.testResults.memory.average.toFixed(2)} MB`,
                    min: `${this.testResults.memory.min.toFixed(2)} MB`,
                    max: `${this.testResults.memory.max.toFixed(2)} MB`
                },
                renderTime: {
                    average: `${this.testResults.renderTime.average.toFixed(2)} ms`,
                    min: `${this.testResults.renderTime.min.toFixed(2)} ms`,
                    max: `${this.testResults.renderTime.max.toFixed(2)} ms`
                },
                physicsTime: {
                    average: `${this.testResults.physicsTime.average.toFixed(2)} ms`,
                    min: `${this.testResults.physicsTime.min.toFixed(2)} ms`,
                    max: `${this.testResults.physicsTime.max.toFixed(2)} ms`
                },
                objectsCount: {
                    average: `${this.testResults.objectsCount.average.toFixed(0)}`,
                    min: `${this.testResults.objectsCount.min.toFixed(0)}`,
                    max: `${this.testResults.objectsCount.max.toFixed(0)}`
                },
                drawCalls: {
                    average: `${this.testResults.drawCalls.average.toFixed(0)}`,
                    min: `${this.testResults.drawCalls.min.toFixed(0)}`,
                    max: `${this.testResults.drawCalls.max.toFixed(0)}`
                }
            },
            overallScore: `${this.testResults.overallScore}/100`,
            performanceGrade: this.getPerformanceGrade(this.testResults.overallScore),
            recommendations: this.generateRecommendations()
        }
        
        return report
    }

    // 获取性能等级
    getPerformanceGrade(score) {
        if (score >= 90) return '优秀（Excellent）'
        if (score >= 80) return '良好（Good）'
        if (score >= 70) return '中等（Fair）'
        if (score >= 60) return '及格（Poor）'
        return '需优化（Needs Improvement）'
    }

    // 生成性能优化建议
    generateRecommendations() {
        const recommendations = []
        
        // 根据FPS生成建议
        if (this.testResults.fps.average < PERFORMANCE_CONFIG.thresholds.fps.fair) {
            recommendations.push('降低游戏渲染质量或减少同时显示的对象数量以提高FPS')
        }
        
        // 根据内存使用生成建议
        if (this.testResults.memory.average > PERFORMANCE_CONFIG.thresholds.memory.warning) {
            recommendations.push('优化资源加载和释放机制，减少内存占用')
        }
        
        // 根据渲染时间生成建议
        if (this.testResults.renderTime.average > PERFORMANCE_CONFIG.thresholds.renderTime.fair) {
            recommendations.push('减少复杂特效使用，优化精灵和纹理批处理')
        }
        
        // 根据FPS稳定性生成建议
        if (this.testResults.fps.stdDev > 5) {
            recommendations.push('优化游戏循环，减少性能波动')
        }
        
        if (recommendations.length === 0) {
            recommendations.push('游戏性能良好，无需特殊优化')
        }
        
        return recommendations
    }

    // 保存测试报告
    saveTestReport(report) {
        // 将测试报告转换为JSON字符串
        const reportJSON = JSON.stringify(report, null, 2)
        
        // 在控制台打印报告
        console.log('性能测试报告:', reportJSON)
        
        // 创建可下载的文件
        const blob = new Blob([reportJSON], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        
        // 创建下载链接
        const a = document.createElement('a')
        a.href = url
        a.download = `performance-report-${new Date().toISOString().replace(/[:.]/g, '-')}.json`
        
        // 自动点击下载（在某些浏览器中可能需要用户交互）
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        
        // 释放URL对象
        URL.revokeObjectURL(url)
    }

    // 启动监控模式
    startMonitoring() {
        if (!this.isRecording) {
            this.isRecording = true
            this.resetPerformanceData()
            this.startSampling()
            this.togglePerformanceUI(true)
            this.updateTestStatusText('性能监控: 运行中')
            console.log('性能监控已启动')
        }
    }

    // 停止监控模式
    stopMonitoring() {
        if (this.isRecording && !this.isTesting) {
            this.isRecording = false
            this.stopSampling()
            this.togglePerformanceUI(false)
            this.updateTestStatusText('性能监控: 已停止')
            console.log('性能监控已停止')
        }
    }

    // 切换监控模式
    toggleMonitoring() {
        if (this.isRecording) {
            this.stopMonitoring()
        } else {
            this.startMonitoring()
        }
    }

    // 获取当前性能数据
    getCurrentPerformanceData() {
        return {
            fps: this.performanceData.fps[this.performanceData.fps.length - 1] || 0,
            memory: this.performanceData.memory[this.performanceData.memory.length - 1] || 0,
            renderTime: this.performanceData.renderTime[this.performanceData.renderTime.length - 1] || 0,
            physicsTime: this.performanceData.physicsTime[this.performanceData.physicsTime.length - 1] || 0,
            updateTime: this.performanceData.updateTime[this.performanceData.updateTime.length - 1] || 0,
            objectsCount: this.performanceData.objectsCount[this.performanceData.objectsCount.length - 1] || 0,
            drawCalls: this.performanceData.drawCalls[this.performanceData.drawCalls.length - 1] || 0
        }
    }

    // 销毁性能测试器
    destroy() {
        this.stopPerformanceTest()
        this.stopMonitoring()
        
        // 移除性能UI
        if (this.performanceUIContainer) {
            this.performanceUIContainer.destroy()
        }
        
        // 清除定时器
        if (this.sampleTimer) {
            this.game.time.removeEvent(this.sampleTimer)
            this.sampleTimer = null
        }
    }
}

// 空场景测试
class EmptySceneTest extends Phaser.Scene {
    constructor() {
        super(TestSceneType.EMPTY_SCENE)
    }

    create() {
        console.log('EmptySceneTest: 空场景性能测试')
        
        // 创建背景
        this.add.rectangle(
            this.sys.game.config.width / 2,
            this.sys.game.config.height / 2,
            this.sys.game.config.width,
            this.sys.game.config.height,
            0x1a1a2e
        )
        
        // 添加测试说明
        this.add.text(
            this.sys.game.config.width / 2,
            this.sys.game.config.height / 2,
            '空场景性能测试',
            { fontSize: '24px', color: '#ffffff' }
        ).setOrigin(0.5)
    }
}

// 基础渲染测试
class BasicRenderTest extends Phaser.Scene {
    constructor() {
        super(TestSceneType.BASIC_RENDER)
        this.spriteCount = 200
    }

    preload() {
        // 加载测试精灵图像
        this.load.image('test-sprite', 'assets/images/test-sprite.png')
    }

    create() {
        console.log('BasicRenderTest: 基础渲染性能测试')
        
        // 创建背景
        this.add.rectangle(
            this.sys.game.config.width / 2,
            this.sys.game.config.height / 2,
            this.sys.game.config.width,
            this.sys.game.config.height,
            0x1a1a2e
        )
        
        // 添加测试说明
        this.add.text(
            this.sys.game.config.width / 2,
            50,
            '基础渲染性能测试',
            { fontSize: '24px', color: '#ffffff' }
        ).setOrigin(0.5)
        
        this.add.text(
            this.sys.game.config.width / 2,
            80,
            `精灵数量: ${this.spriteCount}`,
            { fontSize: '16px', color: '#cccccc' }
        ).setOrigin(0.5)
        
        // 创建大量精灵
        this.createTestSprites()
    }

    createTestSprites() {
        const colors = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff, 0x00ffff]
        
        for (let i = 0; i < this.spriteCount; i++) {
            // 创建精灵（如果图像加载失败，使用图形替代）
            let sprite
            if (this.textures.exists('test-sprite')) {
                sprite = this.add.sprite(0, 0, 'test-sprite')
            } else {
                // 使用图形替代
                sprite = this.add.graphics()
                sprite.fillStyle(colors[i % colors.length], 1)
                sprite.fillCircle(0, 0, 10)
            }
            
            // 设置精灵位置和缩放
            sprite.x = Phaser.Math.Between(50, this.sys.game.config.width - 50)
            sprite.y = Phaser.Math.Between(150, this.sys.game.config.height - 50)
            sprite.scale = Phaser.Math.FloatBetween(0.5, 2)
            
            // 添加简单动画
            this.tweens.add({
                targets: sprite,
                y: {
                    value: [sprite.y, sprite.y - 20, sprite.y],
                    duration: Phaser.Math.Between(1000, 3000),
                    repeat: -1,
                    ease: 'Sine.easeInOut'
                },
                scale: {
                    value: [sprite.scale, sprite.scale * 1.2, sprite.scale],
                    duration: Phaser.Math.Between(1000, 3000),
                    repeat: -1,
                    ease: 'Sine.easeInOut'
                }
            })
        }
    }
}

// 物理系统测试
class PhysicsSystemTest extends Phaser.Scene {
    constructor() {
        super(TestSceneType.PHYSICS_TEST)
        this.physicsObjectsCount = 100
    }

    create() {
        console.log('PhysicsSystemTest: 物理系统性能测试')
        
        // 创建背景
        this.add.rectangle(
            this.sys.game.config.width / 2,
            this.sys.game.config.height / 2,
            this.sys.game.config.width,
            this.sys.game.config.height,
            0x1a1a2e
        )
        
        // 添加测试说明
        this.add.text(
            this.sys.game.config.width / 2,
            50,
            '物理系统性能测试',
            { fontSize: '24px', color: '#ffffff' }
        ).setOrigin(0.5)
        
        this.add.text(
            this.sys.game.config.width / 2,
            80,
            `物理对象数量: ${this.physicsObjectsCount}`,
            { fontSize: '16px', color: '#cccccc' }
        ).setOrigin(0.5)
        
        // 启用物理系统
        this.physics.world.gravity.y = 300
        
        // 创建地面
        const ground = this.physics.add.staticImage(
            this.sys.game.config.width / 2,
            this.sys.game.config.height - 50,
            'platform'
        )
        ground.displayWidth = this.sys.game.config.width
        ground.displayHeight = 100
        
        // 创建左右墙壁
        const leftWall = this.physics.add.staticImage(
            25,
            this.sys.game.config.height / 2,
            'platform'
        )
        leftWall.displayWidth = 50
        leftWall.displayHeight = this.sys.game.config.height
        
        const rightWall = this.physics.add.staticImage(
            this.sys.game.config.width - 25,
            this.sys.game.config.height / 2,
            'platform'
        )
        rightWall.displayWidth = 50
        rightWall.displayHeight = this.sys.game.config.height
        
        // 创建物理对象
        this.createPhysicsObjects()
    }

    createPhysicsObjects() {
        const colors = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff, 0x00ffff]
        
        for (let i = 0; i < this.physicsObjectsCount; i++) {
            // 创建物理对象
            const size = Phaser.Math.Between(10, 30)
            const object = this.physics.add.image(0, 0, 'test-sprite')
            
            // 如果没有图像，使用图形替代
            if (!this.textures.exists('test-sprite')) {
                object.setTexture(this.add.graphics().generateTexture(`physics-object-${i}`, size, size))
            }
            
            object.displayWidth = size
            object.displayHeight = size
            
            // 设置随机位置
            object.x = Phaser.Math.Between(100, this.sys.game.config.width - 100)
            object.y = Phaser.Math.Between(100, this.sys.game.config.height / 2)
            
            // 设置物理属性
            object.setBounce(Phaser.Math.FloatBetween(0.3, 0.8))
            object.setCollideWorldBounds(true)
            object.setDrag(Phaser.Math.Between(10, 50))
            object.setAngularVelocity(Phaser.Math.Between(-100, 100))
            
            // 设置随机颜色
            object.tint = colors[i % colors.length]
            
            // 添加碰撞
            this.physics.add.collider(object)
        }
    }
}

// 大量对象测试
class ManyObjectsTest extends Phaser.Scene {
    constructor() {
        super(TestSceneType.MANY_OBJECTS)
        this.objectsCount = 500
    }

    create() {
        console.log('ManyObjectsTest: 大量对象性能测试')
        
        // 创建背景
        this.add.rectangle(
            this.sys.game.config.width / 2,
            this.sys.game.config.height / 2,
            this.sys.game.config.width,
            this.sys.game.config.height,
            0x1a1a2e
        )
        
        // 添加测试说明
        this.add.text(
            this.sys.game.config.width / 2,
            50,
            '大量对象性能测试',
            { fontSize: '24px', color: '#ffffff' }
        ).setOrigin(0.5)
        
        this.add.text(
            this.sys.game.config.width / 2,
            80,
            `对象数量: ${this.objectsCount}`,
            { fontSize: '16px', color: '#cccccc' }
        ).setOrigin(0.5)
        
        // 创建大量静态对象
        this.createManyObjects()
    }

    createManyObjects() {
        const colors = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff, 0x00ffff]
        
        for (let i = 0; i < this.objectsCount; i++) {
            // 创建对象
            let object
            
            // 随机选择对象类型
            const objectType = Phaser.Math.Between(0, 2)
            
            switch (objectType) {
                case 0: // 圆形
                    object = this.add.circle(0, 0, Phaser.Math.Between(5, 15), colors[i % colors.length], 0.8)
                    break
                case 1: // 矩形
                    const width = Phaser.Math.Between(10, 30)
                    const height = Phaser.Math.Between(10, 30)
                    object = this.add.rectangle(0, 0, width, height, colors[i % colors.length], 0.8)
                    break
                case 2: // 文本
                    object = this.add.text(0, 0, '•', { fontSize: `${Phaser.Math.Between(10, 30)}px`, color: colors[i % colors.length] })
                    object.setOrigin(0.5)
                    break
            }
            
            // 设置随机位置
            object.x = Phaser.Math.Between(50, this.sys.game.config.width - 50)
            object.y = Phaser.Math.Between(150, this.sys.game.config.height - 50)
        }
    }
}

// 特效测试
class EffectsTest extends Phaser.Scene {
    constructor() {
        super(TestSceneType.EFFECTS_TEST)
    }

    preload() {
        // 加载粒子纹理
        this.load.image('particle', 'assets/images/particle.png')
    }

    create() {
        console.log('EffectsTest: 特效性能测试')
        
        // 创建背景
        this.add.rectangle(
            this.sys.game.config.width / 2,
            this.sys.game.config.height / 2,
            this.sys.game.config.width,
            this.sys.game.config.height,
            0x1a1a2e
        )
        
        // 添加测试说明
        this.add.text(
            this.sys.game.config.width / 2,
            50,
            '特效性能测试',
            { fontSize: '24px', color: '#ffffff' }
        ).setOrigin(0.5)
        
        // 创建多个粒子发射器
        this.createParticleEmitters()
        
        // 创建动画效果
        this.createAnimationEffects()
    }

    createParticleEmitters() {
        // 粒子配置
        const particleConfig = {
            speed: 100,
            lifespan: 2000,
            scale: { start: 1, end: 0 },
            alpha: { start: 1, end: 0 },
            blendMode: Phaser.BlendModes.ADD
        }
        
        // 创建5个粒子发射器
        const colors = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff]
        
        for (let i = 0; i < 5; i++) {
            // 创建粒子系统
            let particles
            
            if (this.textures.exists('particle')) {
                particles = this.add.particles('particle')
            } else {
                // 创建临时纹理
                const tempGraphics = this.add.graphics()
                tempGraphics.fillStyle(0xffffff, 1)
                tempGraphics.fillCircle(10, 10, 10)
                tempGraphics.generateTexture('temp-particle', 20, 20)
                tempGraphics.destroy()
                
                particles = this.add.particles('temp-particle')
            }
            
            // 创建发射器
            const emitter = particles.createEmitter({
                ...particleConfig,
                x: Phaser.Math.Between(100, this.sys.game.config.width - 100),
                y: Phaser.Math.Between(200, this.sys.game.config.height - 200),
                frequency: Phaser.Math.Between(50, 200),
                tint: colors[i],
                angle: {
                    min: 0,
                    max: 360
                }
            })
        }
    }

    createAnimationEffects() {
        // 创建多个动画精灵
        for (let i = 0; i < 20; i++) {
            // 创建精灵（使用图形替代）
            const size = Phaser.Math.Between(10, 30)
            const graphics = this.add.graphics()
            graphics.fillStyle(Phaser.Math.RND.color(), 0.8)
            graphics.fillCircle(size / 2, size / 2, size / 2)
            
            const sprite = this.add.sprite(
                Phaser.Math.Between(100, this.sys.game.config.width - 100),
                Phaser.Math.Between(200, this.sys.game.config.height - 200),
                graphics.generateTexture(`anim-sprite-${i}`, size, size)
            )
            
            graphics.destroy()
            
            // 添加复杂动画
            this.tweens.add({
                targets: sprite,
                x: {
                    value: [sprite.x, Phaser.Math.Between(100, this.sys.game.config.width - 100), sprite.x],
                    duration: Phaser.Math.Between(3000, 8000),
                    repeat: -1,
                    ease: 'Sine.easeInOut'
                },
                y: {
                    value: [sprite.y, Phaser.Math.Between(200, this.sys.game.config.height - 200), sprite.y],
                    duration: Phaser.Math.Between(3000, 8000),
                    repeat: -1,
                    ease: 'Sine.easeInOut'
                },
                scale: {
                    value: [sprite.scale, Phaser.Math.FloatBetween(0.5, 2), sprite.scale],
                    duration: Phaser.Math.Between(2000, 5000),
                    repeat: -1,
                    ease: 'Sine.easeInOut'
                },
                alpha: {
                    value: [1, 0.3, 1],
                    duration: Phaser.Math.Between(1000, 3000),
                    repeat: -1,
                    ease: 'Sine.easeInOut'
                },
                rotation: {
                    value: [0, Math.PI * 2, 0],
                    duration: Phaser.Math.Between(5000, 10000),
                    repeat: -1,
                    ease: 'Linear'
                }
            })
        }
    }
}

// 完整游戏场景测试
class FullGameTest extends Phaser.Scene {
    constructor() {
        super(TestSceneType.FULL_GAME)
    }

    create() {
        console.log('FullGameTest: 完整游戏场景性能测试')
        
        // 创建背景
        this.add.rectangle(
            this.sys.game.config.width / 2,
            this.sys.game.config.height / 2,
            this.sys.game.config.width,
            this.sys.game.config.height,
            0x1a1a2e
        )
        
        // 添加测试说明
        this.add.text(
            this.sys.game.config.width / 2,
            50,
            '完整游戏场景性能测试',
            { fontSize: '24px', color: '#ffffff' }
        ).setOrigin(0.5)
        
        this.add.text(
            this.sys.game.config.width / 2,
            80,
            '模拟游戏中的复杂场景',
            { fontSize: '16px', color: '#cccccc' }
        ).setOrigin(0.5)
        
        // 启用物理系统
        this.physics.world.gravity.y = 300
        
        // 创建游戏元素
        this.createGameElements()
    }

    createGameElements() {
        // 创建多个平台
        for (let i = 0; i < 10; i++) {
            const platform = this.physics.add.staticImage(
                Phaser.Math.Between(100, this.sys.game.config.width - 100),
                200 + i * 100,
                'platform'
            )
            platform.displayWidth = Phaser.Math.Between(100, 200)
            platform.displayHeight = 20
        }
        
        // 创建多个障碍物
        for (let i = 0; i < 15; i++) {
            const obstacle = this.physics.add.image(
                Phaser.Math.Between(100, this.sys.game.config.width - 100),
                250 + i * 60,
                'static-obstacle'
            )
            obstacle.displayWidth = Phaser.Math.Between(30, 60)
            obstacle.displayHeight = Phaser.Math.Between(30, 60)
            obstacle.setImmovable(true)
        }
        
        // 创建移动平台
        for (let i = 0; i < 3; i++) {
            const movingPlatform = this.physics.add.image(
                Phaser.Math.Between(150, this.sys.game.config.width - 150),
                300 + i * 200,
                'moving-platform'
            )
            movingPlatform.displayWidth = 100
            movingPlatform.displayHeight = 20
            movingPlatform.setImmovable(true)
            movingPlatform.body.allowGravity = false
            
            // 添加移动动画
            this.tweens.add({
                targets: movingPlatform,
                x: {
                    value: [
                        movingPlatform.x, 
                        movingPlatform.x + Phaser.Math.Between(50, 150), 
                        movingPlatform.x
                    ],
                    duration: Phaser.Math.Between(3000, 5000),
                    repeat: -1,
                    ease: 'Sine.easeInOut'
                }
            })
        }
        
        // 创建粒子效果
        this.createParticleEffects()
        
        // 创建UI元素
        this.createUIElements()
    }

    createParticleEffects() {
        // 创建粒子系统
        let particles
        
        if (this.textures.exists('particle')) {
            particles = this.add.particles('particle')
        } else {
            // 创建临时纹理
            const tempGraphics = this.add.graphics()
            tempGraphics.fillStyle(0xffffff, 1)
            tempGraphics.fillCircle(10, 10, 10)
            tempGraphics.generateTexture('temp-particle', 20, 20)
            tempGraphics.destroy()
            
            particles = this.add.particles('temp-particle')
        }
        
        // 创建2个粒子发射器
        const emitter1 = particles.createEmitter({
            x: 100,
            y: this.sys.game.config.height / 2,
            speed: 50,
            frequency: 100,
            lifespan: 2000,
            scale: { start: 1, end: 0 },
            alpha: { start: 1, end: 0 },
            tint: 0x00ff00,
            blendMode: Phaser.BlendModes.ADD,
            angle: {
                min: -30,
                max: 30
            }
        })
        
        const emitter2 = particles.createEmitter({
            x: this.sys.game.config.width - 100,
            y: this.sys.game.config.height / 2,
            speed: 50,
            frequency: 100,
            lifespan: 2000,
            scale: { start: 1, end: 0 },
            alpha: { start: 1, end: 0 },
            tint: 0x0000ff,
            blendMode: Phaser.BlendModes.ADD,
            angle: {
                min: 150,
                max: 210
            }
        })
    }

    createUIElements() {
        // 创建模拟游戏UI
        
        // 顶部状态栏
        const statusBar = this.add.rectangle(
            this.sys.game.config.width / 2,
            30,
            this.sys.game.config.width - 20,
            60,
            0x000000,
            0.7
        )
        statusBar.setStrokeStyle(1, 0xFFFFFF, 0.5)
        
        // 楼层计数器
        this.add.text(
            40,
            30,
            '楼层: 50/100',
            { fontSize: '16px', color: '#ffffff' }
        ).setOrigin(0, 0.5)
        
        // 计时器
        this.add.text(
            this.sys.game.config.width - 40,
            30,
            '时间: 01:45',
            { fontSize: '16px', color: '#ffffff' }
        ).setOrigin(1, 0.5)
        
        // 底部控制区域
        const controlPanel = this.add.rectangle(
            this.sys.game.config.width / 2,
            this.sys.game.config.height - 50,
            this.sys.game.config.width - 20,
            100,
            0x000000,
            0.7
        )
        controlPanel.setStrokeStyle(1, 0xFFFFFF, 0.5)
        
        // 模拟按钮
        const buttonLabels = ['左手', '右手', '左脚', '右脚', '跳跃']
        for (let i = 0; i < buttonLabels.length; i++) {
            const button = this.add.text(
                100 + i * 150,
                this.sys.game.config.height - 50,
                buttonLabels[i],
                { fontSize: '16px', color: '#ffffff', backgroundColor: '#4CAF50', padding: { x: 10, y: 5 } }
            )
            button.setOrigin(0.5)
            button.setInteractive()
        }
    }

    update() {
        // 在更新循环中添加一些计算密集型操作来模拟游戏逻辑
        for (let i = 0; i < 100; i++) {
            // 模拟物理计算
            const complexCalculation = Math.sin(i) * Math.cos(i) * Math.tan(i) * Math.sqrt(i)
        }
    }
}
