import Phaser from 'phaser'
import { GameScene } from '../scenes/GameScene.js'

// 场景类型枚举
export const SceneType = {
    BOOT: 'BOOT',
    LOAD: 'LOAD',
    START: 'START',
    GAME: 'GAME',
    PAUSE: 'PAUSE',
    GAME_OVER: 'GAME_OVER',
    VICTORY: 'VICTORY',
    LEVEL_EDITOR: 'LEVEL_EDITOR'
}

// 场景管理器类
export class SceneManager {
    constructor(game) {
        this.game = game
        this.currentScene = null
        this.nextScene = null
        this.isTransitioning = false
        this.transitionDuration = 500
        this.sceneHistory = []
        this.sceneData = {}
        
        // 初始化场景管理器
        this.init()
    }

    init() {
        // 注册场景
        this.registerScenes()
        
        // 添加场景切换事件监听器
        this.game.events.on(Phaser.Scenes.Events.SHUTDOWN, (scene) => {
            this.handleSceneShutdown(scene)
        }, this)
        
        this.game.events.on(Phaser.Scenes.Events.CREATE, (scene) => {
            this.handleSceneCreate(scene)
        }, this)
    }

    registerScenes() {
        // 注册游戏场景
        this.game.scene.add(SceneType.GAME, GameScene)
        
        // 注册其他场景
        this.game.scene.add(SceneType.BOOT, BootScene)
        this.game.scene.add(SceneType.LOAD, LoadScene)
        this.game.scene.add(SceneType.START, StartScene)
        this.game.scene.add(SceneType.PAUSE, PauseScene)
        this.game.scene.add(SceneType.GAME_OVER, GameOverScene)
        this.game.scene.add(SceneType.VICTORY, VictoryScene)
        this.game.scene.add(SceneType.LEVEL_EDITOR, LevelEditorScene)
    }

    // 启动游戏
    startGame() {
        this.loadScene(SceneType.BOOT)
    }

    // 加载场景
    loadScene(sceneType, data = {}) {
        if (this.isTransitioning) {
            return
        }
        
        // 存储下一个场景的数据
        this.nextScene = sceneType
        this.sceneData[sceneType] = data
        
        // 如果当前没有场景，直接启动
        if (!this.currentScene) {
            this.game.scene.start(sceneType, data)
            this.currentScene = sceneType
            this.sceneHistory.push(sceneType)
            return
        }
        
        // 开始场景过渡
        this.startSceneTransition()
    }

    // 开始场景过渡
    startSceneTransition() {
        this.isTransitioning = true
        
        // 创建过渡遮罩
        const fadeMask = this.game.add.rectangle(
            this.game.config.width / 2,
            this.game.config.height / 2,
            this.game.config.width,
            this.game.config.height,
            0x000000, 0
        )
        fadeMask.setDepth(10000)
        
        // 淡出当前场景
        this.game.tweens.add({
            targets: fadeMask,
            alpha: 1,
            duration: this.transitionDuration,
            ease: 'Linear',
            onComplete: () => {
                // 关闭当前场景
                this.game.scene.stop(this.currentScene)
                
                // 启动下一个场景
                this.game.scene.start(this.nextScene, this.sceneData[this.nextScene])
                this.currentScene = this.nextScene
                this.sceneHistory.push(this.nextScene)
                
                // 淡入下一个场景
                this.game.tweens.add({
                    targets: fadeMask,
                    alpha: 0,
                    duration: this.transitionDuration,
                    ease: 'Linear',
                    onComplete: () => {
                        fadeMask.destroy()
                        this.isTransitioning = false
                    }
                })
            }
        })
    }

    // 返回上一个场景
    goBack() {
        if (this.sceneHistory.length > 1) {
            // 移除当前场景
            this.sceneHistory.pop()
            // 获取上一个场景
            const previousScene = this.sceneHistory[this.sceneHistory.length - 1]
            this.loadScene(previousScene)
        }
    }

    // 重新启动当前场景
    restartCurrentScene() {
        if (this.currentScene && !this.isTransitioning) {
            this.loadScene(this.currentScene, this.sceneData[this.currentScene])
        }
    }

    // 处理场景关闭
    handleSceneShutdown(scene) {
        // 可以在这里添加场景关闭时的清理逻辑
        console.log(`场景 ${scene.scene.key} 已关闭`)
    }

    // 处理场景创建
    handleSceneCreate(scene) {
        console.log(`场景 ${scene.scene.key} 已创建`)
        // 如果场景实现了setSceneManager方法，传入场景管理器实例
        if (scene.setSceneManager) {
            scene.setSceneManager(this)
        }
    }

    // 获取当前场景
    getCurrentScene() {
        return this.currentScene ? this.game.scene.getScene(this.currentScene) : null
    }

    // 检查场景是否正在运行
    isSceneRunning(sceneType) {
        return this.game.scene.isActive(sceneType)
    }

    // 获取场景数据
    getSceneData(sceneType) {
        return this.sceneData[sceneType] || {}
    }

    // 设置场景数据
    setSceneData(sceneType, data) {
        this.sceneData[sceneType] = { ...this.sceneData[sceneType], ...data }
    }

    // 销毁场景管理器
    destroy() {
        this.game.events.off(Phaser.Scenes.Events.SHUTDOWN)
        this.game.events.off(Phaser.Scenes.Events.CREATE)
        this.sceneHistory = []
        this.sceneData = {}
        this.currentScene = null
        this.nextScene = null
    }
}

// 引导场景
class BootScene extends Phaser.Scene {
    constructor() {
        super(SceneType.BOOT)
    }

    preload() {
        // 预加载加载界面所需的基本资源
        this.load.image('loading-bg', 'assets/images/loading-bg.png')
        this.load.image('loading-bar', 'assets/images/loading-bar.png')
        this.load.image('loading-frame', 'assets/images/loading-frame.png')
        
        // 设置加载进度回调
        this.load.on('progress', (value) => {
            // 可以在这里更新全局加载进度
            if (window.updateLoadingProgress) {
                window.updateLoadingProgress(value)
            }
        })
    }

    create() {
        console.log('BootScene: 初始化游戏')
        
        // 立即跳转到加载场景
        this.scene.start(SceneType.LOAD)
    }
}

// 加载场景
class LoadScene extends Phaser.Scene {
    constructor() {
        super(SceneType.LOAD)
    }

    preload() {
        // 加载游戏所需的所有资源
        
        // 加载玩家资源
        this.load.image('stickman-head', 'assets/images/stickman-head.png')
        this.load.image('stickman-body', 'assets/images/stickman-body.png')
        
        // 加载粒子资源
        this.load.image('sweat', 'assets/images/sweat-drop.png')
        this.load.image('trail', 'assets/images/trail-particle.png')
        this.load.image('goldParticle', 'assets/images/gold-particle.png')
        this.load.image('abilityParticle', 'assets/images/ability-particle.png')
        
        // 加载平台和障碍物资源
        this.load.image('platform', 'assets/images/platform.png')
        this.load.image('moving-platform', 'assets/images/moving-platform.png')
        this.load.image('rotating-platform', 'assets/images/rotating-platform.png')
        this.load.image('disappearing-platform', 'assets/images/disappearing-platform.png')
        this.load.image('narrow-platform', 'assets/images/narrow-platform.png')
        
        this.load.image('static-obstacle', 'assets/images/static-obstacle.png')
        this.load.image('moving-obstacle', 'assets/images/moving-obstacle.png')
        this.load.image('rotating-obstacle', 'assets/images/rotating-obstacle.png')
        this.load.image('disappearing-obstacle', 'assets/images/disappearing-obstacle.png')
        
        // 加载特殊能力资源
        this.load.image('double-jump-icon', 'assets/images/double-jump-icon.png')
        this.load.image('wall-climb-icon', 'assets/images/wall-climb-icon.png')
        this.load.image('rope-swing-icon', 'assets/images/rope-swing-icon.png')
        
        // 加载音效
        // this.load.audio('jump', 'assets/audio/jump.mp3')
        // this.load.audio('land', 'assets/audio/land.mp3')
        // this.load.audio('success', 'assets/audio/success.mp3')
        // this.load.audio('fail', 'assets/audio/fail.mp3')
        // this.load.audio('powerup', 'assets/audio/powerup.mp3')
        
        // 设置加载进度回调
        this.load.on('progress', (value) => {
            // 更新全局加载进度
            if (window.updateLoadingProgress) {
                window.updateLoadingProgress(value)
            }
        })
    }

    create() {
        console.log('LoadScene: 游戏资源加载完成')
        
        // 跳转到开始场景
        this.scene.start(SceneType.START)
    }
}

// 开始场景
class StartScene extends Phaser.Scene {
    constructor() {
        super(SceneType.START)
        this.sceneManager = null
    }

    setSceneManager(sceneManager) {
        this.sceneManager = sceneManager
    }

    create() {
        console.log('StartScene: 游戏开始场景')
        
        // 创建背景
        const background = this.add.rectangle(
            this.sys.game.config.width / 2,
            this.sys.game.config.height / 2,
            this.sys.game.config.width,
            this.sys.game.config.height,
            0x1a1a2e
        )
        
        // 创建标题
        const title = this.add.text(
            this.sys.game.config.width / 2,
            this.sys.game.config.height / 2 - 100,
            '火柴人攀爬100层楼',
            { fontSize: '36px', color: '#ffffff', fontWeight: 'bold' }
        )
        title.setOrigin(0.5)
        
        // 创建副标题
        const subtitle = this.add.text(
            this.sys.game.config.width / 2,
            this.sys.game.config.height / 2 - 50,
            '控制火柴人四肢攀爬，挑战100层楼！',
            { fontSize: '18px', color: '#cccccc' }
        )
        subtitle.setOrigin(0.5)
        
        // 创建开始按钮
        const startButton = this.add.text(
            this.sys.game.config.width / 2,
            this.sys.game.config.height / 2 + 50,
            '点击屏幕开始游戏',
            { fontSize: '24px', color: '#4CAF50' }
        )
        startButton.setOrigin(0.5)
        
        // 添加闪烁动画
        this.tweens.add({
            targets: startButton,
            alpha: [1, 0.5, 1],
            duration: 1000,
            repeat: -1,
            ease: 'Sine.easeInOut'
        })
        
        // 操作说明
        const instructions = this.add.text(
            this.sys.game.config.width / 2,
            this.sys.game.config.height - 100,
            'A/D或方向键: 控制左右手臂 | W/S或方向键: 控制左右腿 | 空格键: 蓄力跳跃',
            { fontSize: '14px', color: '#aaaaaa' }
        )
        instructions.setOrigin(0.5)
        
        // 添加点击开始游戏事件
        this.input.on('pointerdown', () => {
            if (this.sceneManager) {
                this.sceneManager.loadScene(SceneType.GAME)
            } else {
                // 如果没有场景管理器，直接启动游戏场景
                this.scene.start(SceneType.GAME)
            }
        })
        
        // 添加键盘开始游戏事件
        this.input.keyboard.on('keydown-SPACE', () => {
            if (this.sceneManager) {
                this.sceneManager.loadScene(SceneType.GAME)
            } else {
                // 如果没有场景管理器，直接启动游戏场景
                this.scene.start(SceneType.GAME)
            }
        })
    }
}

// 暂停场景
class PauseScene extends Phaser.Scene {
    constructor() {
        super(SceneType.PAUSE)
        this.sceneManager = null
    }

    setSceneManager(sceneManager) {
        this.sceneManager = sceneManager
    }

    create() {
        console.log('PauseScene: 游戏暂停场景')
        
        // 创建半透明背景
        const background = this.add.rectangle(
            this.sys.game.config.width / 2,
            this.sys.game.config.height / 2,
            this.sys.game.config.width,
            this.sys.game.config.height,
            0x000000,
            0.8
        )
        
        // 创建标题
        const title = this.add.text(
            this.sys.game.config.width / 2,
            this.sys.game.config.height / 2 - 100,
            '游戏暂停',
            { fontSize: '36px', color: '#ffffff', fontWeight: 'bold' }
        )
        title.setOrigin(0.5)
        
        // 创建继续游戏按钮
        const resumeButton = this.createButton(
            this.sys.game.config.width / 2,
            this.sys.game.config.height / 2 - 20,
            '继续游戏',
            '#4CAF50',
            () => this.resumeGame()
        )
        
        // 创建重新开始按钮
        const restartButton = this.createButton(
            this.sys.game.config.width / 2,
            this.sys.game.config.height / 2 + 50,
            '重新开始',
            '#ff9800',
            () => this.restartGame()
        )
        
        // 创建返回主菜单按钮
        const menuButton = this.createButton(
            this.sys.game.config.width / 2,
            this.sys.game.config.height / 2 + 120,
            '返回主菜单',
            '#f44336',
            () => this.returnToMenu()
        )
        
        // 添加键盘继续游戏事件
        this.input.keyboard.on('keydown-ESC', () => {
            this.resumeGame()
        })
    }

    createButton(x, y, text, bgColor, callback) {
        const button = this.add.text(
            x,
            y,
            text,
            { fontSize: '24px', color: '#ffffff', backgroundColor: bgColor, padding: { x: 20, y: 10 } }
        )
        button.setOrigin(0.5)
        button.setInteractive()
        button.on('pointerdown', callback)
        button.on('pointerover', () => button.setColor('#000000'))
        button.on('pointerout', () => button.setColor('#ffffff'))
        return button
    }

    resumeGame() {
        if (this.sceneManager) {
            this.sceneManager.goBack()
        } else {
            // 如果没有场景管理器，直接返回上一个场景
            this.scene.stop()
            this.scene.resume(SceneType.GAME)
        }
    }

    restartGame() {
        if (this.sceneManager) {
            this.sceneManager.loadScene(SceneType.GAME)
        } else {
            // 如果没有场景管理器，直接重启游戏场景
            this.scene.stop()
            this.scene.start(SceneType.GAME)
        }
    }

    returnToMenu() {
        if (this.sceneManager) {
            this.sceneManager.loadScene(SceneType.START)
        } else {
            // 如果没有场景管理器，直接返回开始场景
            this.scene.stop()
            this.scene.start(SceneType.START)
        }
    }
}

// 游戏结束场景
class GameOverScene extends Phaser.Scene {
    constructor() {
        super(SceneType.GAME_OVER)
        this.sceneManager = null
    }

    setSceneManager(sceneManager) {
        this.sceneManager = sceneManager
    }

    create() {
        console.log('GameOverScene: 游戏结束场景')
        
        // 创建半透明背景
        const background = this.add.rectangle(
            this.sys.game.config.width / 2,
            this.sys.game.config.height / 2,
            this.sys.game.config.width,
            this.sys.game.config.height,
            0x000000,
            0.8
        )
        
        // 创建标题
        const title = this.add.text(
            this.sys.game.config.width / 2,
            this.sys.game.config.height / 2 - 100,
            '游戏结束',
            { fontSize: '36px', color: '#f44336', fontWeight: 'bold' }
        )
        title.setOrigin(0.5)
        
        // 获取游戏数据
        let score = 0
        if (this.sceneManager) {
            const gameData = this.sceneManager.getSceneData(SceneType.GAME)
            score = gameData.score || 0
        }
        
        // 显示成绩
        const scoreText = this.add.text(
            this.sys.game.config.width / 2,
            this.sys.game.config.height / 2 - 30,
            `你爬到了 ${score} 层楼`,
            { fontSize: '24px', color: '#ffffff' }
        )
        scoreText.setOrigin(0.5)
        
        // 创建重新开始按钮
        const restartButton = this.createButton(
            this.sys.game.config.width / 2,
            this.sys.game.config.height / 2 + 50,
            '重新开始',
            '#4CAF50',
            () => this.restartGame()
        )
        
        // 创建返回主菜单按钮
        const menuButton = this.createButton(
            this.sys.game.config.width / 2,
            this.sys.game.config.height / 2 + 120,
            '返回主菜单',
            '#f44336',
            () => this.returnToMenu()
        )
    }

    createButton(x, y, text, bgColor, callback) {
        const button = this.add.text(
            x,
            y,
            text,
            { fontSize: '24px', color: '#ffffff', backgroundColor: bgColor, padding: { x: 20, y: 10 } }
        )
        button.setOrigin(0.5)
        button.setInteractive()
        button.on('pointerdown', callback)
        button.on('pointerover', () => button.setColor('#000000'))
        button.on('pointerout', () => button.setColor('#ffffff'))
        return button
    }

    restartGame() {
        if (this.sceneManager) {
            this.sceneManager.loadScene(SceneType.GAME)
        } else {
            // 如果没有场景管理器，直接重启游戏场景
            this.scene.start(SceneType.GAME)
        }
    }

    returnToMenu() {
        if (this.sceneManager) {
            this.sceneManager.loadScene(SceneType.START)
        } else {
            // 如果没有场景管理器，直接返回开始场景
            this.scene.start(SceneType.START)
        }
    }
}

// 胜利场景
class VictoryScene extends Phaser.Scene {
    constructor() {
        super(SceneType.VICTORY)
        this.sceneManager = null
    }

    setSceneManager(sceneManager) {
        this.sceneManager = sceneManager
    }

    create() {
        console.log('VictoryScene: 游戏胜利场景')
        
        // 创建半透明背景
        const background = this.add.rectangle(
            this.sys.game.config.width / 2,
            this.sys.game.config.height / 2,
            this.sys.game.config.width,
            this.sys.game.config.height,
            0x000000,
            0.8
        )
        
        // 创建标题
        const title = this.add.text(
            this.sys.game.config.width / 2,
            this.sys.game.config.height / 2 - 150,
            '恭喜你！',
            { fontSize: '48px', color: '#FFD700', fontWeight: 'bold' }
        )
        title.setOrigin(0.5)
        
        // 创建胜利文本
        const victoryText = this.add.text(
            this.sys.game.config.width / 2,
            this.sys.game.config.height / 2 - 80,
            '你成功攀爬了100层楼！',
            { fontSize: '32px', color: '#ffffff' }
        )
        victoryText.setOrigin(0.5)
        
        // 获取游戏数据
        let time = 0
        let mistakes = 0
        if (this.sceneManager) {
            const gameData = this.sceneManager.getSceneData(SceneType.GAME)
            time = gameData.time || 0
            mistakes = gameData.mistakes || 0
        }
        
        // 显示时间
        const minutes = Math.floor(time / 60)
        const seconds = time % 60
        const timeText = this.add.text(
            this.sys.game.config.width / 2,
            this.sys.game.config.height / 2 - 20,
            `用时: ${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`,
            { fontSize: '24px', color: '#ffffff' }
        )
        timeText.setOrigin(0.5)
        
        // 显示失误次数
        const mistakesText = this.add.text(
            this.sys.game.config.width / 2,
            this.sys.game.config.height / 2 + 30,
            `失误次数: ${mistakes}`,
            { fontSize: '24px', color: '#ffffff' }
        )
        mistakesText.setOrigin(0.5)
        
        // 创建再来一次按钮
        const restartButton = this.createButton(
            this.sys.game.config.width / 2,
            this.sys.game.config.height / 2 + 100,
            '再来一次',
            '#4CAF50',
            () => this.restartGame()
        )
        
        // 创建返回主菜单按钮
        const menuButton = this.createButton(
            this.sys.game.config.width / 2,
            this.sys.game.config.height / 2 + 170,
            '返回主菜单',
            '#ff9800',
            () => this.returnToMenu()
        )
    }

    createButton(x, y, text, bgColor, callback) {
        const button = this.add.text(
            x,
            y,
            text,
            { fontSize: '24px', color: '#ffffff', backgroundColor: bgColor, padding: { x: 20, y: 10 } }
        )
        button.setOrigin(0.5)
        button.setInteractive()
        button.on('pointerdown', callback)
        button.on('pointerover', () => button.setColor('#000000'))
        button.on('pointerout', () => button.setColor('#ffffff'))
        return button
    }

    restartGame() {
        if (this.sceneManager) {
            this.sceneManager.loadScene(SceneType.GAME)
        } else {
            // 如果没有场景管理器，直接重启游戏场景
            this.scene.start(SceneType.GAME)
        }
    }

    returnToMenu() {
        if (this.sceneManager) {
            this.sceneManager.loadScene(SceneType.START)
        } else {
            // 如果没有场景管理器，直接返回开始场景
            this.scene.start(SceneType.START)
        }
    }
}

// 关卡编辑器场景
class LevelEditorScene extends Phaser.Scene {
    constructor() {
        super(SceneType.LEVEL_EDITOR)
        this.sceneManager = null
    }

    setSceneManager(sceneManager) {
        this.sceneManager = sceneManager
    }

    create() {
        console.log('LevelEditorScene: 关卡编辑器场景')
        
        // 创建背景
        const background = this.add.rectangle(
            this.sys.game.config.width / 2,
            this.sys.game.config.height / 2,
            this.sys.game.config.width,
            this.sys.game.config.height,
            0x1a1a2e
        )
        
        // 创建标题
        const title = this.add.text(
            this.sys.game.config.width / 2,
            50,
            '关卡编辑器',
            { fontSize: '36px', color: '#ffffff', fontWeight: 'bold' }
        )
        title.setOrigin(0.5)
        
        // 创建返回按钮
        const backButton = this.createButton(
            50,
            50,
            '返回',
            '#f44336',
            () => {
                if (this.sceneManager) {
                    this.sceneManager.loadScene(SceneType.START)
                } else {
                    this.scene.start(SceneType.START)
                }
            }
        )
        
        // 添加编辑器UI元素
        // 这里只是简单的示例，完整的关卡编辑器需要更复杂的UI和功能
        const editorInfo = this.add.text(
            this.sys.game.config.width / 2,
            this.sys.game.config.height / 2,
            '关卡编辑器功能正在开发中...',
            { fontSize: '24px', color: '#ffffff' }
        )
        editorInfo.setOrigin(0.5)
    }

    createButton(x, y, text, bgColor, callback) {
        const button = this.add.text(
            x,
            y,
            text,
            { fontSize: '18px', color: '#ffffff', backgroundColor: bgColor, padding: { x: 10, y: 5 } }
        )
        button.setOrigin(0, 0.5)
        button.setInteractive()
        button.on('pointerdown', callback)
        button.on('pointerover', () => button.setColor('#000000'))
        button.on('pointerout', () => button.setColor('#ffffff'))
        return button
    }
}
