import Phaser from 'phaser'
import { updateLoadingProgress } from '../index.js'
import { Stickman } from '../objects/Stickman.js'
import { FloorGenerator } from '../systems/FloorGenerator.js'
import { GameUI } from '../ui/GameUI.js'
import { LevelManager } from '../systems/LevelManager.js'

export class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' })
        this.stickman = null
        this.floorGenerator = null
        this.gameUI = null
        this.levelManager = null
        this.currentFloor = 0
        this.maxFloors = 100
        this.platforms = []
        this.obstacles = []
        this.cursors = null
        this.jumpButton = null
        this.leftArmButton = null
        this.rightArmButton = null
        this.leftLegButton = null
        this.rightLegButton = null
        this.gameStarted = false
        this.gameOver = false
        this.pause = false
    }

    preload() {
        // 加载资源
        this.load.image('background', '/assets/images/background.png')
        this.load.image('platform', '/assets/images/platform.png')
        this.load.image('obstacle', '/assets/images/obstacle.png')
        this.load.spritesheet('stickman', '/assets/images/stickman.png', {
            frameWidth: 64,
            frameHeight: 64
        })
        
        // 更新加载进度
        this.load.on('progress', (value) => {
            updateLoadingProgress(value)
        })
    }

    create() {
        // 创建物理世界边界
        this.matter.world.setBounds(0, 0, this.sys.game.config.width, this.sys.game.config.height)
        
        // 创建背景
        this.add.image(0, 0, 'background').setOrigin(0, 0).setDisplaySize(this.sys.game.config.width, this.sys.game.config.height)
        
        // 初始化系统
        this.floorGenerator = new FloorGenerator(this)
        this.levelManager = new LevelManager(this)
        this.gameUI = new GameUI(this)
        
        // 创建火柴人
        this.stickman = new Stickman(this, this.sys.game.config.width / 2, this.sys.game.config.height - 100)
        
        // 生成初始楼层
        this.generateInitialFloors()
        
        // 设置输入控制
        this.setupControls()
        
        // 设置相机跟随
        this.cameras.main.startFollow(this.stickman.sprite, true, 0.1, 0.1)
        this.cameras.main.setDeadzone(0, 200)
        
        // 添加游戏开始提示
        this.gameUI.showStartScreen()
        
        // 添加游戏状态事件监听
        this.stickman.on('floorReached', (floorNumber) => this.onFloorReached(floorNumber))
        this.stickman.on('fell', () => this.onStickmanFell())
    }

    update(time, delta) {
        if (this.pause || !this.gameStarted || this.gameOver) return
        
        // 更新火柴人状态
        this.stickman.update(delta)
        
        // 检查相机位置，生成新楼层
        this.checkCameraBounds()
        
        // 更新UI
        this.gameUI.update()
        
        // 更新障碍物
        this.updateObstacles(delta)
    }

    setupControls() {
        // 键盘控制
        this.cursors = this.input.keyboard.createCursorKeys()
        
        // 四指独立控制键位设置
        this.input.keyboard.on('keydown', (event) => {
            if (!this.gameStarted || this.gameOver || this.pause) return
            
            switch(event.key) {
                case 'a':
                case 'ArrowLeft':
                    this.stickman.controlLeftArm()
                    break
                case 'd':
                case 'ArrowRight':
                    this.stickman.controlRightArm()
                    break
                case 'w':
                case 'ArrowUp':
                    this.stickman.controlLeftLeg()
                    break
                case 's':
                case 'ArrowDown':
                    this.stickman.controlRightLeg()
                    break
                case ' ': // 空格蓄力跳跃
                    this.stickman.startChargingJump()
                    break
                case 'p': // 暂停游戏
                    this.togglePause()
                    break
            }
        })
        
        this.input.keyboard.on('keyup', (event) => {
            if (!this.gameStarted || this.gameOver || this.pause) return
            
            if (event.key === ' ') {
                this.stickman.releaseJump()
            }
        })
        
        // 触摸屏控制 (移动端)
        this.setupTouchControls()
        
        // 鼠标点击开始游戏
        this.input.on('pointerdown', () => {
            if (!this.gameStarted) {
                this.startGame()
            }
        })
    }

    setupTouchControls() {
        // 创建虚拟按钮
        const buttonRadius = 50
        const buttonY = this.sys.game.config.height - buttonRadius * 2
        
        // 左手臂按钮
        this.leftArmButton = this.add.circle(buttonRadius * 2, buttonY, buttonRadius, 0x0000ff, 0.3)
        this.add.text(this.leftArmButton.x, this.leftArmButton.y, '左臂', { fontSize: '16px', color: '#ffffff' })
            .setOrigin(0.5)
        this.leftArmButton.setInteractive()
        this.leftArmButton.on('pointerdown', () => this.stickman.controlLeftArm())
        
        // 右手臂按钮
        this.rightArmButton = this.add.circle(buttonRadius * 4, buttonY, buttonRadius, 0xff0000, 0.3)
        this.add.text(this.rightArmButton.x, this.rightArmButton.y, '右臂', { fontSize: '16px', color: '#ffffff' })
            .setOrigin(0.5)
        this.rightArmButton.setInteractive()
        this.rightArmButton.on('pointerdown', () => this.stickman.controlRightArm())
        
        // 左腿按钮
        this.leftLegButton = this.add.circle(this.sys.game.config.width - buttonRadius * 4, buttonY, buttonRadius, 0x00ff00, 0.3)
        this.add.text(this.leftLegButton.x, this.leftLegButton.y, '左腿', { fontSize: '16px', color: '#ffffff' })
            .setOrigin(0.5)
        this.leftLegButton.setInteractive()
        this.leftLegButton.on('pointerdown', () => this.stickman.controlLeftLeg())
        
        // 右腿按钮
        this.rightLegButton = this.add.circle(this.sys.game.config.width - buttonRadius * 2, buttonY, buttonRadius, 0xffff00, 0.3)
        this.add.text(this.rightLegButton.x, this.rightLegButton.y, '右腿', { fontSize: '16px', color: '#ffffff' })
            .setOrigin(0.5)
        this.rightLegButton.setInteractive()
        this.rightLegButton.on('pointerdown', () => this.stickman.controlRightLeg())
        
        // 跳跃按钮
        this.jumpButton = this.add.circle(this.sys.game.config.width / 2, buttonY, buttonRadius + 20, 0xff6600, 0.3)
        this.add.text(this.jumpButton.x, this.jumpButton.y, '跳跃', { fontSize: '16px', color: '#ffffff' })
            .setOrigin(0.5)
        this.jumpButton.setInteractive()
        this.jumpButton.on('pointerdown', () => this.stickman.startChargingJump())
        this.jumpButton.on('pointerup', () => this.stickman.releaseJump())
        this.jumpButton.on('pointerout', () => this.stickman.releaseJump())
    }

    generateInitialFloors() {
        // 生成初始的5层楼
        for (let i = 0; i < 5; i++) {
            const floorY = this.sys.game.config.height - (i + 1) * 150
            const floor = this.floorGenerator.generateFloor(this.currentFloor, floorY)
            this.platforms.push(floor)
            this.currentFloor++
        }
    }

    checkCameraBounds() {
        const camera = this.cameras.main
        const cameraTop = camera.worldView.y
        const spawnThreshold = cameraTop - 200
        
        // 移除离开屏幕的平台
        this.platforms = this.platforms.filter(platform => {
            if (platform.y > camera.worldView.y + camera.worldView.height + 100) {
                platform.destroy()
                return false
            }
            return true
        })
        
        // 生成新平台
        if (this.platforms.length > 0) {
            const highestPlatform = this.platforms.reduce((highest, platform) => 
                platform.y < highest.y ? platform : highest, this.platforms[0])
            
            if (highestPlatform.y > spawnThreshold && this.currentFloor < this.maxFloors) {
                const newFloor = this.floorGenerator.generateFloor(this.currentFloor, highestPlatform.y - 150)
                this.platforms.push(newFloor)
                this.currentFloor++
            }
        }
    }

    updateObstacles(delta) {
        // 更新移动和旋转的障碍物
        this.obstacles.forEach(obstacle => {
            if (obstacle.type === 'moving') {
                // 左右移动障碍物
                obstacle.movingTime += delta
                const moveDistance = Math.sin(obstacle.movingTime * 0.005) * obstacle.moveRange
                obstacle.body.position.x = obstacle.originalX + moveDistance
            } else if (obstacle.type === 'rotating') {
                // 旋转障碍物
                obstacle.setAngularVelocity(obstacle.rotationSpeed)
            } else if (obstacle.type === 'disappearing') {
                // 消失台阶
                obstacle.lifeTime -= delta
                if (obstacle.lifeTime <= 0) {
                    obstacle.setVisible(false)
                    obstacle.body.isSensor = true
                }
            }
        })
    }

    onFloorReached(floorNumber) {
        // 检查是否到达新楼层
        if (floorNumber > this.levelManager.getCurrentLevel()) {
            this.levelManager.setCurrentLevel(floorNumber)
            this.gameUI.updateFloorCount(floorNumber)
            
            // 每10层解锁新能力
            if (floorNumber % 10 === 0 && floorNumber > 0) {
                this.levelManager.unlockNewAbility(floorNumber)
                this.gameUI.showAbilityUnlockNotification(floorNumber)
            }
            
            // 每10层设置特殊挑战层
            if (floorNumber % 10 === 0 && floorNumber > 0) {
                this.levelManager.activateSpecialChallenge(floorNumber)
            }
        }
        
        // 检查是否完成游戏
        if (floorNumber >= this.maxFloors) {
            this.completeGame()
        }
    }

    onStickmanFell() {
        // 检查是否有安全网保护
        if (this.levelManager.hasSafetyNet()) {
            this.levelManager.useSafetyNet()
            this.stickman.respawn()
            this.gameUI.showSafetyNetUsedNotification()
        } else {
            this.gameOver = true
            this.gameUI.showGameOverScreen()
        }
    }

    startGame() {
        this.gameStarted = true
        this.gameUI.hideStartScreen()
        this.gameUI.updateFloorCount(0)
    }

    togglePause() {
        this.pause = !this.pause
        if (this.pause) {
            this.physics.pause()
            this.gameUI.showPauseScreen()
        } else {
            this.physics.resume()
            this.gameUI.hidePauseScreen()
        }
    }

    completeGame() {
        this.gameOver = true
        this.gameUI.showVictoryScreen()
    }

    restartGame() {
        // 清理当前场景
        this.platforms.forEach(platform => platform.destroy())
        this.obstacles.forEach(obstacle => obstacle.destroy())
        
        // 重置游戏状态
        this.platforms = []
        this.obstacles = []
        this.currentFloor = 0
        this.gameStarted = false
        this.gameOver = false
        this.pause = false
        
        // 重新创建游戏元素
        this.create()
    }
}
