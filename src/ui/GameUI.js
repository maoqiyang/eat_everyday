import Phaser from 'phaser'

// 游戏UI类
export class GameUI {
    constructor(scene) {
        this.scene = scene
        this.uiContainer = null
        this.floorCounter = null
        this.energyBar = null
        this.staminaBar = null
        this.safetyNetBar = null
        this.startScreen = null
        this.gameOverScreen = null
        this.pauseScreen = null
        this.victoryScreen = null
        this.notificationContainer = null
        this.timerText = null
        this.mistakesCounter = null
        
        // 初始化UI
        this.init()
    }

    init() {
        // 创建UI容器
        this.uiContainer = this.scene.add.container(0, 0)
        this.uiContainer.setDepth(1000)
        
        // 创建通知容器
        this.notificationContainer = this.scene.add.container(0, 0)
        this.notificationContainer.setDepth(2000)
        this.uiContainer.add(this.notificationContainer)
        
        // 创建游戏中UI元素
        this.createInGameUI()
        
        // 创建各种屏幕
        this.createStartScreen()
        this.createGameOverScreen()
        this.createPauseScreen()
        this.createVictoryScreen()
        
        // 初始状态下只显示开始屏幕
        this.hideAllScreens()
    }

    createInGameUI() {
        // 背景面板
        const panel = this.scene.add.rectangle(
            this.scene.sys.game.config.width / 2,
            30,
            this.scene.sys.game.config.width - 20,
            60,
            0x000000,
            0.5
        )
        panel.setStrokeStyle(1, 0xFFFFFF)
        this.uiContainer.add(panel)
        
        // 楼层计数器
        this.floorCounter = this.scene.add.text(
            20,
            30,
            '楼层: 0/100',
            { fontSize: '16px', color: '#ffffff' }
        )
        this.floorCounter.setOrigin(0, 0.5)
        this.uiContainer.add(this.floorCounter)
        
        // 计时器
        this.timerText = this.scene.add.text(
            this.scene.sys.game.config.width - 20,
            30,
            '时间: 00:00',
            { fontSize: '16px', color: '#ffffff' }
        )
        this.timerText.setOrigin(1, 0.5)
        this.uiContainer.add(this.timerText)
        
        // 失误计数器
        this.mistakesCounter = this.scene.add.text(
            this.scene.sys.game.config.width / 2,
            30,
            '失误: 0',
            { fontSize: '16px', color: '#ffffff' }
        )
        this.mistakesCounter.setOrigin(0.5, 0.5)
        this.uiContainer.add(this.mistakesCounter)
        
        // 创建能量条
        this.createEnergyBar()
        
        // 创建体力条
        this.createStaminaBar()
        
        // 创建安全网能量条
        this.createSafetyNetBar()
    }

    createEnergyBar() {
        // 能量条背景
        const energyBarBg = this.scene.add.rectangle(
            20,
            100,
            200,
            15,
            0x000000,
            0.5
        )
        energyBarBg.setStrokeStyle(1, 0xFFFFFF)
        energyBarBg.setOrigin(0, 0.5)
        this.uiContainer.add(energyBarBg)
        
        // 能量条填充
        this.energyBar = this.scene.add.rectangle(
            20,
            100,
            200,
            15,
            0x4CAF50,
            1
        )
        this.energyBar.setOrigin(0, 0.5)
        this.uiContainer.add(this.energyBar)
        
        // 能量条标签
        const energyLabel = this.scene.add.text(
            20,
            85,
            '能量',
            { fontSize: '12px', color: '#ffffff' }
        )
        energyLabel.setOrigin(0, 0.5)
        this.uiContainer.add(energyLabel)
    }

    createStaminaBar() {
        // 体力条背景
        const staminaBarBg = this.scene.add.rectangle(
            20,
            130,
            200,
            15,
            0x000000,
            0.5
        )
        staminaBarBg.setStrokeStyle(1, 0xFFFFFF)
        staminaBarBg.setOrigin(0, 0.5)
        this.uiContainer.add(staminaBarBg)
        
        // 体力条填充
        this.staminaBar = this.scene.add.rectangle(
            20,
            130,
            200,
            15,
            0x2196F3,
            1
        )
        this.staminaBar.setOrigin(0, 0.5)
        this.uiContainer.add(this.staminaBar)
        
        // 体力条标签
        const staminaLabel = this.scene.add.text(
            20,
            115,
            '体力',
            { fontSize: '12px', color: '#ffffff' }
        )
        staminaLabel.setOrigin(0, 0.5)
        this.uiContainer.add(staminaLabel)
    }

    createSafetyNetBar() {
        // 安全网能量条背景
        const safetyNetBarBg = this.scene.add.rectangle(
            20,
            160,
            200,
            15,
            0x000000,
            0.5
        )
        safetyNetBarBg.setStrokeStyle(1, 0xFFFFFF)
        safetyNetBarBg.setOrigin(0, 0.5)
        this.uiContainer.add(safetyNetBarBg)
        
        // 安全网能量条填充
        this.safetyNetBar = this.scene.add.rectangle(
            20,
            160,
            200,
            15,
            0xFF9800,
            1
        )
        this.safetyNetBar.setOrigin(0, 0.5)
        this.uiContainer.add(this.safetyNetBar)
        
        // 安全网能量条标签
        const safetyNetLabel = this.scene.add.text(
            20,
            145,
            '安全网',
            { fontSize: '12px', color: '#ffffff' }
        )
        safetyNetLabel.setOrigin(0, 0.5)
        this.uiContainer.add(safetyNetLabel)
    }

    createStartScreen() {
        // 创建开始屏幕容器
        this.startScreen = this.scene.add.container(0, 0)
        this.startScreen.setDepth(3000)
        
        // 背景
        const background = this.scene.add.rectangle(
            this.scene.sys.game.config.width / 2,
            this.scene.sys.game.config.height / 2,
            this.scene.sys.game.config.width,
            this.scene.sys.game.config.height,
            0x000000,
            0.8
        )
        this.startScreen.add(background)
        
        // 标题
        const title = this.scene.add.text(
            this.scene.sys.game.config.width / 2,
            this.scene.sys.game.config.height / 2 - 100,
            '火柴人攀爬100层楼',
            { fontSize: '36px', color: '#ffffff', fontWeight: 'bold' }
        )
        title.setOrigin(0.5)
        this.startScreen.add(title)
        
        // 副标题
        const subtitle = this.scene.add.text(
            this.scene.sys.game.config.width / 2,
            this.scene.sys.game.config.height / 2 - 50,
            '控制火柴人四肢攀爬，挑战100层楼！',
            { fontSize: '18px', color: '#cccccc' }
        )
        subtitle.setOrigin(0.5)
        this.startScreen.add(subtitle)
        
        // 开始提示
        const startPrompt = this.scene.add.text(
            this.scene.sys.game.config.width / 2,
            this.scene.sys.game.config.height / 2 + 50,
            '点击屏幕开始游戏',
            { fontSize: '24px', color: '#4CAF50' }
        )
        startPrompt.setOrigin(0.5)
        this.startScreen.add(startPrompt)
        
        // 添加闪烁动画
        this.scene.tweens.add({
            targets: startPrompt,
            alpha: [1, 0.5, 1],
            duration: 1000,
            repeat: -1,
            ease: 'Sine.easeInOut'
        })
        
        // 操作说明
        const instructions = this.scene.add.text(
            this.scene.sys.game.config.width / 2,
            this.scene.sys.game.config.height - 100,
            'A/D或方向键: 控制左右手臂 | W/S或方向键: 控制左右腿 | 空格键: 蓄力跳跃',
            { fontSize: '14px', color: '#aaaaaa' }
        )
        instructions.setOrigin(0.5)
        this.startScreen.add(instructions)
        
        this.uiContainer.add(this.startScreen)
        this.startScreen.setVisible(false)
    }

    createGameOverScreen() {
        // 创建游戏结束屏幕容器
        this.gameOverScreen = this.scene.add.container(0, 0)
        this.gameOverScreen.setDepth(3000)
        
        // 背景
        const background = this.scene.add.rectangle(
            this.scene.sys.game.config.width / 2,
            this.scene.sys.game.config.height / 2,
            this.scene.sys.game.config.width,
            this.scene.sys.game.config.height,
            0x000000,
            0.8
        )
        this.gameOverScreen.add(background)
        
        // 标题
        const title = this.scene.add.text(
            this.scene.sys.game.config.width / 2,
            this.scene.sys.game.config.height / 2 - 100,
            '游戏结束',
            { fontSize: '36px', color: '#f44336', fontWeight: 'bold' }
        )
        title.setOrigin(0.5)
        this.gameOverScreen.add(title)
        
        // 成绩显示
        this.gameOverScoreText = this.scene.add.text(
            this.scene.sys.game.config.width / 2,
            this.scene.sys.game.config.height / 2 - 30,
            '你爬到了 0 层楼',
            { fontSize: '24px', color: '#ffffff' }
        )
        this.gameOverScoreText.setOrigin(0.5)
        this.gameOverScreen.add(this.gameOverScoreText)
        
        // 重新开始按钮
        const restartButton = this.scene.add.text(
            this.scene.sys.game.config.width / 2,
            this.scene.sys.game.config.height / 2 + 50,
            '重新开始',
            { fontSize: '24px', color: '#ffffff', backgroundColor: '#4CAF50', padding: { x: 20, y: 10 } }
        )
        restartButton.setOrigin(0.5)
        restartButton.setInteractive()
        restartButton.on('pointerdown', () => this.scene.restartGame())
        restartButton.on('pointerover', () => restartButton.setColor('#000000'))
        restartButton.on('pointerout', () => restartButton.setColor('#ffffff'))
        this.gameOverScreen.add(restartButton)
        
        this.uiContainer.add(this.gameOverScreen)
        this.gameOverScreen.setVisible(false)
    }

    createPauseScreen() {
        // 创建暂停屏幕容器
        this.pauseScreen = this.scene.add.container(0, 0)
        this.pauseScreen.setDepth(3000)
        
        // 背景
        const background = this.scene.add.rectangle(
            this.scene.sys.game.config.width / 2,
            this.scene.sys.game.config.height / 2,
            this.scene.sys.game.config.width,
            this.scene.sys.game.config.height,
            0x000000,
            0.8
        )
        this.pauseScreen.add(background)
        
        // 标题
        const title = this.scene.add.text(
            this.scene.sys.game.config.width / 2,
            this.scene.sys.game.config.height / 2 - 100,
            '游戏暂停',
            { fontSize: '36px', color: '#ffffff', fontWeight: 'bold' }
        )
        title.setOrigin(0.5)
        this.pauseScreen.add(title)
        
        // 继续游戏按钮
        const resumeButton = this.scene.add.text(
            this.scene.sys.game.config.width / 2,
            this.scene.sys.game.config.height / 2 - 20,
            '继续游戏',
            { fontSize: '24px', color: '#ffffff', backgroundColor: '#4CAF50', padding: { x: 20, y: 10 } }
        )
        resumeButton.setOrigin(0.5)
        resumeButton.setInteractive()
        resumeButton.on('pointerdown', () => this.scene.togglePause())
        resumeButton.on('pointerover', () => resumeButton.setColor('#000000'))
        resumeButton.on('pointerout', () => resumeButton.setColor('#ffffff'))
        this.pauseScreen.add(resumeButton)
        
        // 重新开始按钮
        const restartButton = this.scene.add.text(
            this.scene.sys.game.config.width / 2,
            this.scene.sys.game.config.height / 2 + 50,
            '重新开始',
            { fontSize: '24px', color: '#ffffff', backgroundColor: '#ff9800', padding: { x: 20, y: 10 } }
        )
        restartButton.setOrigin(0.5)
        restartButton.setInteractive()
        restartButton.on('pointerdown', () => this.scene.restartGame())
        restartButton.on('pointerover', () => restartButton.setColor('#000000'))
        restartButton.on('pointerout', () => restartButton.setColor('#ffffff'))
        this.pauseScreen.add(restartButton)
        
        // 返回主菜单按钮
        const menuButton = this.scene.add.text(
            this.scene.sys.game.config.width / 2,
            this.scene.sys.game.config.height / 2 + 120,
            '返回主菜单',
            { fontSize: '24px', color: '#ffffff', backgroundColor: '#f44336', padding: { x: 20, y: 10 } }
        )
        menuButton.setOrigin(0.5)
        menuButton.setInteractive()
        menuButton.on('pointerdown', () => {
            this.scene.restartGame()
            this.showStartScreen()
        })
        menuButton.on('pointerover', () => menuButton.setColor('#000000'))
        menuButton.on('pointerout', () => menuButton.setColor('#ffffff'))
        this.pauseScreen.add(menuButton)
        
        this.uiContainer.add(this.pauseScreen)
        this.pauseScreen.setVisible(false)
    }

    createVictoryScreen() {
        // 创建胜利屏幕容器
        this.victoryScreen = this.scene.add.container(0, 0)
        this.victoryScreen.setDepth(3000)
        
        // 背景
        const background = this.scene.add.rectangle(
            this.scene.sys.game.config.width / 2,
            this.scene.sys.game.config.height / 2,
            this.scene.sys.game.config.width,
            this.scene.sys.game.config.height,
            0x000000,
            0.8
        )
        this.victoryScreen.add(background)
        
        // 标题
        const title = this.scene.add.text(
            this.scene.sys.game.config.width / 2,
            this.scene.sys.game.config.height / 2 - 150,
            '恭喜你！',
            { fontSize: '48px', color: '#FFD700', fontWeight: 'bold' }
        )
        title.setOrigin(0.5)
        this.victoryScreen.add(title)
        
        // 胜利文本
        const victoryText = this.scene.add.text(
            this.scene.sys.game.config.width / 2,
            this.scene.sys.game.config.height / 2 - 80,
            '你成功攀爬了100层楼！',
            { fontSize: '32px', color: '#ffffff' }
        )
        victoryText.setOrigin(0.5)
        this.victoryScreen.add(victoryText)
        
        // 时间显示
        this.victoryTimeText = this.scene.add.text(
            this.scene.sys.game.config.width / 2,
            this.scene.sys.game.config.height / 2 - 20,
            '用时: 00:00',
            { fontSize: '24px', color: '#ffffff' }
        )
        this.victoryTimeText.setOrigin(0.5)
        this.victoryScreen.add(this.victoryTimeText)
        
        // 失误次数显示
        this.victoryMistakesText = this.scene.add.text(
            this.scene.sys.game.config.width / 2,
            this.scene.sys.game.config.height / 2 + 30,
            '失误次数: 0',
            { fontSize: '24px', color: '#ffffff' }
        )
        this.victoryMistakesText.setOrigin(0.5)
        this.victoryScreen.add(this.victoryMistakesText)
        
        // 重新开始按钮
        const restartButton = this.scene.add.text(
            this.scene.sys.game.config.width / 2,
            this.scene.sys.game.config.height / 2 + 100,
            '再来一次',
            { fontSize: '24px', color: '#ffffff', backgroundColor: '#4CAF50', padding: { x: 20, y: 10 } }
        )
        restartButton.setOrigin(0.5)
        restartButton.setInteractive()
        restartButton.on('pointerdown', () => this.scene.restartGame())
        restartButton.on('pointerover', () => restartButton.setColor('#000000'))
        restartButton.on('pointerout', () => restartButton.setColor('#ffffff'))
        this.victoryScreen.add(restartButton)
        
        // 返回主菜单按钮
        const menuButton = this.scene.add.text(
            this.scene.sys.game.config.width / 2,
            this.scene.sys.game.config.height / 2 + 170,
            '返回主菜单',
            { fontSize: '24px', color: '#ffffff', backgroundColor: '#ff9800', padding: { x: 20, y: 10 } }
        )
        menuButton.setOrigin(0.5)
        menuButton.setInteractive()
        menuButton.on('pointerdown', () => {
            this.scene.restartGame()
            this.showStartScreen()
        })
        menuButton.on('pointerover', () => menuButton.setColor('#000000'))
        menuButton.on('pointerout', () => menuButton.setColor('#ffffff'))
        this.victoryScreen.add(menuButton)
        
        this.uiContainer.add(this.victoryScreen)
        this.victoryScreen.setVisible(false)
    }

    update() {
        // 更新楼层计数器
        if (this.scene.stickman && this.floorCounter) {
            const currentFloor = this.scene.stickman.getCurrentFloor()
            this.floorCounter.setText(`楼层: ${currentFloor}/100`)
        }
        
        // 更新能量条
        if (this.scene.stickman && this.energyBar) {
            const energyPercentage = (this.scene.stickman.getEnergy() / this.scene.stickman.maxEnergy) * 100
            const barWidth = (energyPercentage / 100) * 200
            this.energyBar.width = barWidth
            
            // 根据能量值改变颜色
            if (energyPercentage > 50) {
                this.energyBar.fillColor = 0x4CAF50 // 绿色
            } else if (energyPercentage > 20) {
                this.energyBar.fillColor = 0xFF9800 // 橙色
            } else {
                this.energyBar.fillColor = 0xF44336 // 红色
            }
        }
        
        // 更新体力条
        if (this.scene.levelManager && this.staminaBar) {
            const staminaPercentage = this.scene.levelManager.getStaminaPercentage()
            const barWidth = (staminaPercentage / 100) * 200
            this.staminaBar.width = barWidth
            
            // 根据体力值改变颜色
            if (staminaPercentage > 50) {
                this.staminaBar.fillColor = 0x2196F3 // 蓝色
            } else if (staminaPercentage > 20) {
                this.staminaBar.fillColor = 0xFF9800 // 橙色
            } else {
                this.staminaBar.fillColor = 0xF44336 // 红色
            }
        }
        
        // 更新安全网能量条
        if (this.scene.levelManager && this.safetyNetBar) {
            const safetyNetPercentage = this.scene.levelManager.getSafetyNetPercentage()
            const barWidth = (safetyNetPercentage / 100) * 200
            this.safetyNetBar.width = barWidth
            
            // 根据安全网能量值改变颜色
            if (safetyNetPercentage >= this.scene.levelManager.safetyNetThreshold) {
                this.safetyNetBar.fillColor = 0xFFD700 // 金色
            } else {
                this.safetyNetBar.fillColor = 0xFF9800 // 橙色
            }
        }
        
        // 更新计时器
        if (this.scene.levelManager && this.timerText) {
            const currentTime = Date.now()
            const elapsedTime = Math.floor((currentTime - this.scene.levelManager.performanceData.startTime) / 1000)
            const minutes = Math.floor(elapsedTime / 60)
            const seconds = elapsedTime % 60
            this.timerText.setText(`时间: ${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`)
        }
        
        // 更新失误计数器
        if (this.scene.levelManager && this.mistakesCounter) {
            this.mistakesCounter.setText(`失误: ${this.scene.levelManager.performanceData.mistakes}`)
        }
        
        // 如果游戏结束，更新游戏结束界面
        if (this.scene.gameOver && this.gameOverScoreText) {
            const currentFloor = this.scene.stickman ? this.scene.stickman.getCurrentFloor() : 0
            this.gameOverScoreText.setText(`你爬到了 ${currentFloor} 层楼`)
        }
        
        // 如果游戏胜利，更新胜利界面
        if (this.scene.gameOver && this.scene.stickman && 
            this.scene.stickman.getCurrentFloor() >= this.scene.maxFloors && 
            this.victoryTimeText && this.victoryMistakesText) {
            
            // 计算完成时间
            const currentTime = Date.now()
            const elapsedTime = Math.floor((currentTime - this.scene.levelManager.performanceData.startTime) / 1000)
            const minutes = Math.floor(elapsedTime / 60)
            const seconds = elapsedTime % 60
            this.victoryTimeText.setText(`用时: ${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`)
            
            // 显示失误次数
            this.victoryMistakesText.setText(`失误次数: ${this.scene.levelManager.performanceData.mistakes}`)
        }
    }

    // 屏幕控制方法
    showStartScreen() {
        this.hideAllScreens()
        this.startScreen.setVisible(true)
    }

    hideStartScreen() {
        if (this.startScreen) {
            this.startScreen.setVisible(false)
        }
    }

    showGameOverScreen() {
        this.hideAllScreens()
        this.gameOverScreen.setVisible(true)
    }

    showPauseScreen() {
        this.hideAllScreens()
        this.pauseScreen.setVisible(true)
    }

    hidePauseScreen() {
        if (this.pauseScreen) {
            this.pauseScreen.setVisible(false)
        }
    }

    showVictoryScreen() {
        this.hideAllScreens()
        this.victoryScreen.setVisible(true)
    }

    hideAllScreens() {
        if (this.startScreen) this.startScreen.setVisible(false)
        if (this.gameOverScreen) this.gameOverScreen.setVisible(false)
        if (this.pauseScreen) this.pauseScreen.setVisible(false)
        if (this.victoryScreen) this.victoryScreen.setVisible(false)
    }

    // 更新方法
    updateFloorCount(floorNumber) {
        if (this.floorCounter) {
            this.floorCounter.setText(`楼层: ${floorNumber}/100`)
        }
    }

    // 通知方法
    showNotification(message, duration = 2000, color = '#ffffff', bgColor = 'rgba(0, 0, 0, 0.7)') {
        // 创建通知背景
        const notificationBg = this.scene.add.rectangle(
            this.scene.sys.game.config.width / 2,
            100,
            this.scene.sys.game.config.width * 0.7,
            60,
            bgColor
        )
        notificationBg.setStrokeStyle(1, color)
        notificationBg.setOrigin(0.5)
        
        // 创建通知文本
        const notificationText = this.scene.add.text(
            this.scene.sys.game.config.width / 2,
            100,
            message,
            { fontSize: '18px', color: color }
        )
        notificationText.setOrigin(0.5)
        
        // 添加到通知容器
        this.notificationContainer.add(notificationBg)
        this.notificationContainer.add(notificationText)
        
        // 设置初始透明度为0
        notificationBg.alpha = 0
        notificationText.alpha = 0
        
        // 创建淡入动画
        this.scene.tweens.add({
            targets: [notificationBg, notificationText],
            alpha: 1,
            duration: 300,
            onComplete: () => {
                // 延迟后淡出
                this.scene.time.delayedCall(duration, () => {
                    this.scene.tweens.add({
                        targets: [notificationBg, notificationText],
                        alpha: 0,
                        duration: 300,
                        onComplete: () => {
                            // 移除通知
                            notificationBg.destroy()
                            notificationText.destroy()
                        }
                    })
                })
            }
        })
    }

    showAbilityUnlockNotification(floorNumber) {
        let abilityName = ''
        
        switch (floorNumber) {
            case 10:
                abilityName = '二段跳'
                break
            case 20:
                abilityName = '墙壁攀爬'
                break
            case 30:
                abilityName = '绳索摆荡'
                break
        }
        
        if (abilityName) {
            this.showNotification(
                `🎉 恭喜！你解锁了新能力: ${abilityName}！`,
                3000,
                '#4CAF50',
                'rgba(76, 175, 80, 0.2)'
            )
        }
    }

    showSafetyNetUsedNotification() {
        this.showNotification(
            '🛡️ 安全网已激活！',
            2000,
            '#FFD700',
            'rgba(255, 215, 0, 0.2)'
        )
    }

    showChallengeNotification(challengeName) {
        this.showNotification(
            `⚠️ 挑战开始: ${challengeName}！`,
            3000,
            '#FF9800',
            'rgba(255, 152, 0, 0.2)'
        )
    }

    hideChallengeNotification() {
        // 清除所有挑战相关的通知
        const children = this.notificationContainer.getAll()
        for (let i = children.length - 1; i >= 0; i--) {
            if (children[i].text && children[i].text.includes('挑战开始')) {
                children[i].destroy()
            }
        }
    }

    // 销毁方法
    destroy() {
        if (this.uiContainer) {
            this.uiContainer.destroy()
        }
    }
}
