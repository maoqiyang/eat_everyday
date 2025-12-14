import Phaser from 'phaser'
import { SceneManager } from './systems/SceneManager.js'
import { PerformanceTester, TestSceneType } from './systems/PerformanceTester.js'

// 游戏配置
const config = {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    parent: 'gameCanvas',
    physics: {
        default: 'matter',
        matter: {
            gravity: { y: 1 },
            debug: false
        }
    },
    scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        min: {
            width: 320,
            height: 240
        },
        max: {
            width: 1600,
            height: 1200
        }
    },
    scene: []
}

// 游戏实例
let game
let performanceTester
let sceneManager

// 加载进度处理
function updateLoadingProgress(progress) {
    const progressBar = document.getElementById('progress-bar')
    const loadingText = document.getElementById('loading-text')
    if (progressBar && loadingText) {
        const percentage = Math.floor(progress * 100)
        progressBar.style.width = `${percentage}%`
        loadingText.textContent = `加载中... ${percentage}%`
        
        if (percentage === 100) {
            setTimeout(() => {
                const loadingScreen = document.getElementById('loading-screen')
                if (loadingScreen) {
                    loadingScreen.style.display = 'none'
                }
            }, 500)
        }
    }
}

// 创建游戏
function createGame() {
    // 初始化场景管理器
    sceneManager = new SceneManager(config)
    
    // 创建游戏实例
    game = new Phaser.Game(config)
    
    // 注册场景
    sceneManager.registerScenes(game)
    
    // 初始化性能测试器
    performanceTester = new PerformanceTester(game)
    
    // 设置窗口大小变化监听
    window.addEventListener('resize', () => {
        if (game) {
            game.scale.resize(window.innerWidth, window.innerHeight)
        }
    })
    
    // 添加全局性能测试控制函数（供开发者使用）
    window.startPerformanceTest = (testType = TestSceneType.FULL_GAME, duration = 60000) => {
        if (performanceTester) {
            performanceTester.startPerformanceTest(testType, duration)
        }
    }
    
    window.togglePerformanceMonitor = () => {
        if (performanceTester) {
            performanceTester.toggleMonitoring()
        }
    }
    
    window.getPerformanceData = () => {
        if (performanceTester) {
            return performanceTester.getCurrentPerformanceData()
        }
        return null
    }
}

// 暴露进度更新函数给场景使用
export { updateLoadingProgress }

// 当页面加载完成后创建游戏
window.addEventListener('load', createGame)

// 导出游戏实例和性能测试器供其他模块使用
export { game, performanceTester, sceneManager }
