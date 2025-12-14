import Phaser from 'phaser'

// 楼层生成器类
export class FloorGenerator {
    constructor(scene) {
        this.scene = scene
        this.floorWidth = 120
        this.floorHeight = 10
        this.platformMinWidth = 50
        this.platformMaxWidth = 150
        this.platformSpacingMin = 30
        this.platformSpacingMax = 80
        this.obstacleChance = 0.3
        this.movingObstacleChance = 0.1
        this.rotatingObstacleChance = 0.05
        this.disappearingObstacleChance = 0.05
        this.specialChallengeInterval = 10
        this.obstacleDensity = 1 // 基础障碍物密度
        this.seed = null
        
        // 初始化随机种子
        this.initSeed()
    }

    initSeed() {
        // 使用当前时间作为种子，确保每次游戏生成不同的楼层
        this.seed = Date.now()
        Phaser.Math.RandomXY.setSeed(this.seed)
    }

    generateFloor(floorNumber, yPosition) {
        // 根据楼层数调整难度
        this.adjustDifficultyByFloor(floorNumber)
        
        // 检查是否是特殊挑战层
        const isSpecialChallenge = floorNumber % this.specialChallengeInterval === 0 && floorNumber > 0
        
        // 创建楼层容器
        const floorContainer = this.scene.add.container(0, yPosition)
        
        // 生成基础平台
        const platforms = this.generatePlatforms(yPosition, isSpecialChallenge)
        platforms.forEach(platform => floorContainer.add(platform.sprite))
        
        // 在平台上生成障碍物
        const obstacles = this.generateObstacles(platforms, floorNumber, isSpecialChallenge)
        obstacles.forEach(obstacle => floorContainer.add(obstacle.sprite))
        
        // 添加楼层标记
        const floorLabel = this.scene.add.text(
            this.scene.sys.game.config.width - 60,
            yPosition - 20,
            `第 ${floorNumber} 层`,
            { fontSize: '14px', color: '#ffffff', backgroundColor: 'rgba(0,0,0,0.5)' }
        )
        floorLabel.setOrigin(0.5)
        floorContainer.add(floorLabel)
        
        // 存储平台和障碍物引用
        floorContainer.platforms = platforms
        floorContainer.obstacles = obstacles
        floorContainer.floorNumber = floorNumber
        floorContainer.y = yPosition
        
        // 为容器添加destroy方法
        floorContainer.destroy = function() {
            // 销毁所有物理对象
            this.platforms.forEach(platform => {
                if (platform.body) {
                    this.scene.matter.world.remove(platform.body)
                }
                if (platform.sprite) {
                    platform.sprite.destroy()
                }
            })
            
            this.obstacles.forEach(obstacle => {
                if (obstacle.body) {
                    this.scene.matter.world.remove(obstacle.body)
                }
                if (obstacle.sprite) {
                    obstacle.sprite.destroy()
                }
            })
            
            // 销毁自身
            Phaser.GameObjects.Container.prototype.destroy.call(this)
        }
        
        return floorContainer
    }

    generatePlatforms(yPosition, isSpecialChallenge) {
        const platforms = []
        let x = 50
        
        // 确定平台生成策略
        let platformGenerationStrategy = this.generateStandardPlatforms
        
        if (isSpecialChallenge) {
            // 特殊挑战层使用不同的平台生成策略
            const strategies = [
                this.generateMovingPlatforms,
                this.generateRotatingPlatforms,
                this.generateDisappearingPlatforms,
                this.generateNarrowPlatforms
            ]
            const randomIndex = Phaser.Math.Between(0, strategies.length - 1)
            platformGenerationStrategy = strategies[randomIndex]
        }
        
        // 使用选定的策略生成平台
        platformGenerationStrategy.call(this, platforms, x, yPosition)
        
        return platforms
    }

    generateStandardPlatforms(platforms, startX, yPosition) {
        let x = startX
        
        while (x < this.scene.sys.game.config.width - 50) {
            // 随机平台宽度
            const width = Phaser.Math.Between(this.platformMinWidth, this.platformMaxWidth)
            
            // 创建平台物理对象
            const platformBody = this.scene.matter.add.rectangle(x + width / 2, yPosition, width, this.floorHeight, {
                isStatic: true,
                friction: 0.8,
                restitution: 0.1
            })
            
            // 创建平台显示对象
            const platformSprite = this.scene.add.rectangle(x + width / 2, yPosition, width, this.floorHeight, 0x888888)
            platformSprite.setStrokeStyle(1, 0x000000)
            
            // 存储平台信息
            platforms.push({
                body: platformBody,
                sprite: platformSprite,
                x: x + width / 2,
                y: yPosition,
                width: width,
                height: this.floorHeight
            })
            
            // 增加x坐标，添加随机间距
            x += width + Phaser.Math.Between(this.platformSpacingMin, this.platformSpacingMax)
        }
    }

    generateMovingPlatforms(platforms, startX, yPosition) {
        let x = startX
        
        while (x < this.scene.sys.game.config.width - 50) {
            // 随机平台宽度
            const width = Phaser.Math.Between(this.platformMinWidth, this.platformMaxWidth)
            
            // 创建平台物理对象
            const platformBody = this.scene.matter.add.rectangle(x + width / 2, yPosition, width, this.floorHeight, {
                isStatic: false,
                friction: 0.8,
                restitution: 0.1
            })
            
            // 创建平台显示对象
            const platformSprite = this.scene.add.rectangle(x + width / 2, yPosition, width, this.floorHeight, 0x4CAF50)
            platformSprite.setStrokeStyle(1, 0x000000)
            
            // 设置平台移动属性
            const moveRange = Phaser.Math.Between(50, 100)
            const moveSpeed = Phaser.Math.FloatBetween(0.001, 0.003)
            
            // 存储平台信息
            platforms.push({
                body: platformBody,
                sprite: platformSprite,
                x: x + width / 2,
                y: yPosition,
                width: width,
                height: this.floorHeight,
                type: 'moving',
                originalX: x + width / 2,
                moveRange: moveRange,
                moveSpeed: moveSpeed,
                movingTime: 0
            })
            
            // 添加平台移动动画
            this.scene.tweens.add({
                targets: platformBody,
                x: x + width / 2 + moveRange,
                duration: 2000 / moveSpeed,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut',
                onUpdate: function(tween, target) {
                    platformSprite.x = target.x
                }
            })
            
            // 增加x坐标，添加随机间距
            x += width + Phaser.Math.Between(this.platformSpacingMin + 20, this.platformSpacingMax + 20)
        }
    }

    generateRotatingPlatforms(platforms, startX, yPosition) {
        let x = startX
        
        while (x < this.scene.sys.game.config.width - 50) {
            // 随机平台宽度
            const width = Phaser.Math.Between(this.platformMinWidth, this.platformMaxWidth)
            
            // 创建平台物理对象
            const platformBody = this.scene.matter.add.rectangle(x + width / 2, yPosition, width, this.floorHeight, {
                isStatic: false,
                friction: 0.8,
                restitution: 0.1
            })
            
            // 创建平台显示对象
            const platformSprite = this.scene.add.rectangle(x + width / 2, yPosition, width, this.floorHeight, 0x2196F3)
            platformSprite.setStrokeStyle(1, 0x000000)
            
            // 设置旋转速度
            const rotationSpeed = Phaser.Math.FloatBetween(-0.01, 0.01)
            
            // 存储平台信息
            platforms.push({
                body: platformBody,
                sprite: platformSprite,
                x: x + width / 2,
                y: yPosition,
                width: width,
                height: this.floorHeight,
                type: 'rotating',
                rotationSpeed: rotationSpeed
            })
            
            // 应用旋转
            platformBody.setAngularVelocity(rotationSpeed)
            
            // 增加x坐标，添加随机间距
            x += width + Phaser.Math.Between(this.platformSpacingMin + 20, this.platformSpacingMax + 20)
        }
    }

    generateDisappearingPlatforms(platforms, startX, yPosition) {
        let x = startX
        
        while (x < this.scene.sys.game.config.width - 50) {
            // 随机平台宽度
            const width = Phaser.Math.Between(this.platformMinWidth, this.platformMaxWidth)
            
            // 创建平台物理对象
            const platformBody = this.scene.matter.add.rectangle(x + width / 2, yPosition, width, this.floorHeight, {
                isStatic: true,
                friction: 0.8,
                restitution: 0.1
            })
            
            // 创建平台显示对象
            const platformSprite = this.scene.add.rectangle(x + width / 2, yPosition, width, this.floorHeight, 0xFF9800)
            platformSprite.setStrokeStyle(1, 0x000000)
            
            // 设置平台消失属性
            const lifeTime = Phaser.Math.Between(2000, 5000)
            const respawnTime = Phaser.Math.Between(3000, 7000)
            
            // 存储平台信息
            const platformInfo = {
                body: platformBody,
                sprite: platformSprite,
                x: x + width / 2,
                y: yPosition,
                width: width,
                height: this.floorHeight,
                type: 'disappearing',
                lifeTime: lifeTime,
                respawnTime: respawnTime,
                originalLifeTime: lifeTime,
                isVisible: true
            }
            platforms.push(platformInfo)
            
            // 添加平台消失和重生逻辑
            this.addDisappearingPlatformLogic(platformInfo)
            
            // 增加x坐标，添加随机间距
            x += width + Phaser.Math.Between(this.platformSpacingMin + 10, this.platformSpacingMax + 10)
        }
    }

    generateNarrowPlatforms(platforms, startX, yPosition) {
        let x = startX
        
        while (x < this.scene.sys.game.config.width - 50) {
            // 更窄的平台宽度
            const width = Phaser.Math.Between(this.platformMinWidth - 20, this.platformMinWidth)
            
            // 创建平台物理对象
            const platformBody = this.scene.matter.add.rectangle(x + width / 2, yPosition, width, this.floorHeight, {
                isStatic: true,
                friction: 0.8,
                restitution: 0.1
            })
            
            // 创建平台显示对象
            const platformSprite = this.scene.add.rectangle(x + width / 2, yPosition, width, this.floorHeight, 0xFF5722)
            platformSprite.setStrokeStyle(1, 0x000000)
            
            // 存储平台信息
            platforms.push({
                body: platformBody,
                sprite: platformSprite,
                x: x + width / 2,
                y: yPosition,
                width: width,
                height: this.floorHeight
            })
            
            // 增加x坐标，添加更大的随机间距
            x += width + Phaser.Math.Between(this.platformSpacingMax, this.platformSpacingMax + 50)
        }
    }

    addDisappearingPlatformLogic(platform) {
        // 平台消失和重生的循环逻辑
        const cycle = () => {
            // 显示平台
            platform.sprite.setVisible(true)
            platform.body.isSensor = false
            platform.lifeTime = platform.originalLifeTime
            
            // 平台闪烁效果
            this.scene.tweens.add({
                targets: platform.sprite,
                alpha: [1, 0.5, 1],
                duration: 500,
                repeat: -1,
                ease: 'Sine.easeInOut'
            })
            
            // 等待一段时间后消失
            this.scene.time.delayedCall(platform.lifeTime, () => {
                // 平台消失动画
                this.scene.tweens.add({
                    targets: platform.sprite,
                    alpha: 0,
                    duration: 500,
                    onComplete: () => {
                        platform.sprite.setVisible(false)
                        platform.body.isSensor = true
                        
                        // 等待一段时间后重生
                        this.scene.time.delayedCall(platform.respawnTime, cycle)
                    }
                })
            })
        }
        
        // 开始循环
        cycle()
    }

    generateObstacles(platforms, floorNumber, isSpecialChallenge) {
        const obstacles = []
        
        // 根据楼层数调整障碍物密度
        let obstacleDensity = this.obstacleDensity
        if (floorNumber > 30) {
            obstacleDensity = Phaser.Math.FloatBetween(3, 5)
        } else {
            obstacleDensity = Phaser.Math.FloatBetween(1, 2)
        }
        
        // 为每个平台生成障碍物
        platforms.forEach(platform => {
            // 计算这个平台上应该生成的障碍物数量
            const obstacleCount = Math.floor(obstacleDensity * (platform.width / 100))
            
            for (let i = 0; i < obstacleCount; i++) {
                const shouldGenerate = Phaser.Math.FloatBetween(0, 1) < this.obstacleChance
                
                if (shouldGenerate) {
                    const obstacle = this.generateRandomObstacle(platform, floorNumber, isSpecialChallenge)
                    if (obstacle) {
                        obstacles.push(obstacle)
                        
                        // 添加到场景的障碍物数组
                        this.scene.obstacles.push(obstacle)
                    }
                }
            }
        })
        
        return obstacles
    }

    generateRandomObstacle(platform, floorNumber, isSpecialChallenge) {
        let obstacleType = 'static'
        const rand = Phaser.Math.FloatBetween(0, 1)
        
        // 确定障碍物类型
        if (rand < this.movingObstacleChance) {
            obstacleType = 'moving'
        } else if (rand < this.movingObstacleChance + this.rotatingObstacleChance) {
            obstacleType = 'rotating'
        } else if (rand < this.movingObstacleChance + this.rotatingObstacleChance + this.disappearingObstacleChance) {
            obstacleType = 'disappearing'
        }
        
        // 随机障碍物位置
        const x = platform.x + Phaser.Math.Between(-platform.width / 2 + 20, platform.width / 2 - 20)
        const y = platform.y - 30 - Phaser.Math.Between(10, 30)
        
        // 随机障碍物大小
        const size = Phaser.Math.Between(10, 30)
        
        // 创建障碍物物理对象
        const obstacleBody = this.scene.matter.add.rectangle(x, y, size, size, {
            isStatic: obstacleType === 'static',
            friction: 0.2,
            restitution: 0.3
        })
        
        // 创建障碍物显示对象
        const colors = [0xFF0000, 0xFF9800, 0xFFEB3B, 0xF44336, 0xE91E63]
        const color = colors[Phaser.Math.Between(0, colors.length - 1)]
        const obstacleSprite = this.scene.add.rectangle(x, y, size, size, color)
        obstacleSprite.setStrokeStyle(1, 0x000000)
        
        // 创建障碍物信息对象
        const obstacle = {
            body: obstacleBody,
            sprite: obstacleSprite,
            x: x,
            y: y,
            size: size,
            type: obstacleType
        }
        
        // 根据类型设置特殊属性
        if (obstacleType === 'moving') {
            obstacle.moveRange = Phaser.Math.Between(30, 60)
            obstacle.moveTime = 0
            
            // 添加移动动画
            this.scene.tweens.add({
                targets: obstacleBody,
                x: x + obstacle.moveRange,
                duration: 2000,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut',
                onUpdate: function(tween, target) {
                    obstacleSprite.x = target.x
                }
            })
        } else if (obstacleType === 'rotating') {
            obstacle.rotationSpeed = Phaser.Math.FloatBetween(-0.02, 0.02)
            obstacleBody.setAngularVelocity(obstacle.rotationSpeed)
        } else if (obstacleType === 'disappearing') {
            obstacle.lifeTime = Phaser.Math.Between(1000, 3000)
            obstacle.respawnTime = Phaser.Math.Between(2000, 5000)
            obstacle.originalLifeTime = obstacle.lifeTime
            
            // 添加消失和重生逻辑
            this.addDisappearingObstacleLogic(obstacle)
        }
        
        return obstacle
    }

    addDisappearingObstacleLogic(obstacle) {
        // 障碍物消失和重生的循环逻辑
        const cycle = () => {
            // 显示障碍物
            obstacle.sprite.setVisible(true)
            obstacle.body.isSensor = false
            obstacle.lifeTime = obstacle.originalLifeTime
            
            // 障碍物闪烁效果
            this.scene.tweens.add({
                targets: obstacle.sprite,
                alpha: [1, 0.5, 1],
                duration: 300,
                repeat: -1,
                ease: 'Sine.easeInOut'
            })
            
            // 等待一段时间后消失
            this.scene.time.delayedCall(obstacle.lifeTime, () => {
                // 障碍物消失动画
                this.scene.tweens.add({
                    targets: obstacle.sprite,
                    alpha: 0,
                    duration: 300,
                    onComplete: () => {
                        obstacle.sprite.setVisible(false)
                        obstacle.body.isSensor = true
                        
                        // 等待一段时间后重生
                        this.scene.time.delayedCall(obstacle.respawnTime, cycle)
                    }
                })
            })
        }
        
        // 开始循环
        cycle()
    }

    adjustDifficultyByFloor(floorNumber) {
        // 根据楼层数调整难度参数
        if (floorNumber > 70) {
            // 最高难度
            this.platformMinWidth = 30
            this.platformMaxWidth = 80
            this.platformSpacingMin = 50
            this.platformSpacingMax = 120
            this.obstacleChance = 0.6
            this.movingObstacleChance = 0.2
            this.rotatingObstacleChance = 0.15
            this.disappearingObstacleChance = 0.15
        } else if (floorNumber > 40) {
            // 中等难度
            this.platformMinWidth = 40
            this.platformMaxWidth = 100
            this.platformSpacingMin = 40
            this.platformSpacingMax = 100
            this.obstacleChance = 0.45
            this.movingObstacleChance = 0.15
            this.rotatingObstacleChance = 0.1
            this.disappearingObstacleChance = 0.1
        } else if (floorNumber > 10) {
            // 初级难度
            this.platformMinWidth = 50
            this.platformMaxWidth = 120
            this.platformSpacingMin = 35
            this.platformSpacingMax = 85
            this.obstacleChance = 0.35
            this.movingObstacleChance = 0.1
            this.rotatingObstacleChance = 0.05
            this.disappearingObstacleChance = 0.05
        } else {
            // 入门难度
            this.platformMinWidth = 60
            this.platformMaxWidth = 150
            this.platformSpacingMin = 30
            this.platformSpacingMax = 80
            this.obstacleChance = 0.25
            this.movingObstacleChance = 0.05
            this.rotatingObstacleChance = 0.02
            this.disappearingObstacleChance = 0.02
        }
    }

    // 获取和设置方法
    getSeed() {
        return this.seed
    }

    setSeed(seed) {
        this.seed = seed
        Phaser.Math.RandomXY.setSeed(seed)
    }

    getFloorDifficulty(floorNumber) {
        // 返回指定楼层的难度级别
        if (floorNumber > 70) return 4
        if (floorNumber > 40) return 3
        if (floorNumber > 10) return 2
        return 1
    }
}
