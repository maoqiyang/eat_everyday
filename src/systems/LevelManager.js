import Phaser from 'phaser'

// 关卡管理器类
export class LevelManager {
    constructor(scene) {
        this.scene = scene
        this.currentLevel = 0
        this.maxLevels = 100
        this.abilities = {
            doubleJump: {
                unlocked: false,
                level: 10,
                description: '二段跳'
            },
            wallClimb: {
                unlocked: false,
                level: 20,
                description: '墙壁攀爬'
            },
            ropeSwing: {
                unlocked: false,
                level: 30,
                description: '绳索摆荡'
            }
        }
        this.safetyNetCharge = 0
        this.maxSafetyNetCharge = 100
        this.safetyNetThreshold = 80
        this.specialChallenges = []
        this.activeChallenge = null
        this.currentChallengeTimer = 0
        this.stamina = 100
        this.maxStamina = 100
        this.staminaRegenRate = 0.05
        this.staminaDepletionRate = 0.1
        this.lastCheckpoint = 0
        this.performanceData = {
            startTime: Date.now(),
            bestTime: Infinity,
            totalAttempts: 0,
            successRate: 0,
            lastCompletionTime: 0,
            mistakes: 0
        }
        
        // 加载保存的游戏数据
        this.loadGameData()
    }

    loadGameData() {
        // 尝试从localStorage加载游戏数据
        const savedData = localStorage.getItem('climb100floors_data')
        if (savedData) {
            try {
                const data = JSON.parse(savedData)
                this.performanceData = { ...this.performanceData, ...data.performanceData }
                this.maxSafetyNetCharge = data.maxSafetyNetCharge || this.maxSafetyNetCharge
                
                // 根据保存的数据解锁能力
                if (data.highestLevel >= 10) {
                    this.abilities.doubleJump.unlocked = true
                }
                if (data.highestLevel >= 20) {
                    this.abilities.wallClimb.unlocked = true
                }
                if (data.highestLevel >= 30) {
                    this.abilities.ropeSwing.unlocked = true
                }
            } catch (e) {
                console.error('Failed to load game data:', e)
            }
        }
    }

    saveGameData() {
        // 保存游戏数据到localStorage
        const data = {
            performanceData: this.performanceData,
            highestLevel: Math.max(this.currentLevel, this.performanceData.highestLevel || 0),
            maxSafetyNetCharge: this.maxSafetyNetCharge,
            timestamp: Date.now()
        }
        
        try {
            localStorage.setItem('climb100floors_data', JSON.stringify(data))
        } catch (e) {
            console.error('Failed to save game data:', e)
        }
    }

    getCurrentLevel() {
        return this.currentLevel
    }

    setCurrentLevel(level) {
        if (level > this.currentLevel) {
            this.currentLevel = level
            
            // 更新最高记录
            if (!this.performanceData.highestLevel || level > this.performanceData.highestLevel) {
                this.performanceData.highestLevel = level
                this.saveGameData()
            }
            
            // 更新检查点
            if (level % 10 === 0) {
                this.lastCheckpoint = level
            }
        }
    }

    unlockNewAbility(level) {
        // 检查是否可以解锁新能力
        for (const abilityKey in this.abilities) {
            const ability = this.abilities[abilityKey]
            if (ability.level === level && !ability.unlocked) {
                ability.unlocked = true
                
                // 应用能力到火柴人
                this.scene.stickman.unlockAbility(abilityKey)
                
                // 保存游戏数据
                this.saveGameData()
                
                return ability
            }
        }
        
        return null
    }

    activateSpecialChallenge(level) {
        // 清除当前活跃的挑战
        if (this.activeChallenge) {
            this.deactivateCurrentChallenge()
        }
        
        // 根据楼层选择特殊挑战
        const challengeTypes = [
            this.createMovingPlatformsChallenge,
            this.createRotatingObstaclesChallenge,
            this.createDisappearingPlatformsChallenge,
            this.createStrongWindChallenge,
            this.createGravityShiftChallenge
        ]
        
        // 每10层选择不同类型的挑战
        const challengeIndex = (level / 10) % challengeTypes.length
        this.activeChallenge = challengeTypes[Math.floor(challengeIndex)].call(this, level)
        
        // 设置挑战持续时间
        this.currentChallengeTimer = 30000 // 30秒
        
        // 添加挑战UI提示
        this.scene.gameUI.showChallengeNotification(this.activeChallenge.name)
        
        return this.activeChallenge
    }

    deactivateCurrentChallenge() {
        if (this.activeChallenge && this.activeChallenge.onDeactivate) {
            this.activeChallenge.onDeactivate.call(this)
        }
        
        this.activeChallenge = null
        this.currentChallengeTimer = 0
        
        // 清除挑战UI提示
        this.scene.gameUI.hideChallengeNotification()
    }

    // 特殊挑战类型
    createMovingPlatformsChallenge(level) {
        return {
            name: '移动平台挑战',
            description: '平台会左右移动，考验你的反应能力！',
            level: level,
            onActivate: () => {
                // 增加当前楼层所有平台的移动速度
                this.scene.platforms.forEach(floor => {
                    if (floor.platforms) {
                        floor.platforms.forEach(platform => {
                            if (platform.type === 'moving' && platform.body) {
                                // 保存原始速度
                                if (!platform.originalSpeed) {
                                    platform.originalSpeed = platform.moveSpeed
                                }
                                // 增加移动速度
                                platform.moveSpeed *= 1.5
                            }
                        })
                    }
                })
            },
            onDeactivate: () => {
                // 恢复平台移动速度
                this.scene.platforms.forEach(floor => {
                    if (floor.platforms) {
                        floor.platforms.forEach(platform => {
                            if (platform.type === 'moving' && platform.originalSpeed) {
                                platform.moveSpeed = platform.originalSpeed
                                delete platform.originalSpeed
                            }
                        })
                    }
                })
            }
        }
    }

    createRotatingObstaclesChallenge(level) {
        return {
            name: '旋转障碍物挑战',
            description: '障碍物会快速旋转，小心避开！',
            level: level,
            onActivate: () => {
                // 增加当前楼层所有旋转障碍物的旋转速度
                this.scene.obstacles.forEach(obstacle => {
                    if (obstacle.type === 'rotating' && obstacle.body) {
                        // 保存原始旋转速度
                        if (!obstacle.originalRotationSpeed) {
                            obstacle.originalRotationSpeed = obstacle.rotationSpeed
                        }
                        // 增加旋转速度
                        obstacle.body.setAngularVelocity(obstacle.rotationSpeed * 2)
                    }
                })
            },
            onDeactivate: () => {
                // 恢复障碍物旋转速度
                this.scene.obstacles.forEach(obstacle => {
                    if (obstacle.type === 'rotating' && obstacle.originalRotationSpeed) {
                        obstacle.body.setAngularVelocity(obstacle.originalRotationSpeed)
                        delete obstacle.originalRotationSpeed
                    }
                })
            }
        }
    }

    createDisappearingPlatformsChallenge(level) {
        return {
            name: '消失平台挑战',
            description: '平台出现时间缩短，抓紧时间通过！',
            level: level,
            onActivate: () => {
                // 缩短平台出现时间
                this.scene.platforms.forEach(floor => {
                    if (floor.platforms) {
                        floor.platforms.forEach(platform => {
                            if (platform.type === 'disappearing') {
                                // 保存原始生命值
                                if (!platform.originalLifeTime) {
                                    platform.originalLifeTime = platform.lifeTime
                                }
                                // 缩短出现时间
                                platform.lifeTime = platform.lifeTime / 2
                            }
                        })
                    }
                })
            },
            onDeactivate: () => {
                // 恢复平台出现时间
                this.scene.platforms.forEach(floor => {
                    if (floor.platforms) {
                        floor.platforms.forEach(platform => {
                            if (platform.type === 'disappearing' && platform.originalLifeTime) {
                                platform.lifeTime = platform.originalLifeTime
                            }
                        })
                    }
                })
            }
        }
    }

    createStrongWindChallenge(level) {
        return {
            name: '强风挑战',
            description: '强风会影响你的移动，注意控制！',
            level: level,
            windForce: new Phaser.Math.Vector2(Phaser.Math.FloatBetween(-0.0002, 0.0002), 0),
            onActivate: function() {
                // 保存原始空气阻力
                if (!this.scene.physics.matter.world.hasOwnProperty('originalAirFriction')) {
                    this.scene.physics.matter.world.originalAirFriction = this.scene.physics.matter.world.frictionAir
                }
                
                // 增加空气阻力
                this.scene.physics.matter.world.frictionAir = 0.02
            },
            onUpdate: function() {
                // 周期性改变风力方向
                if (this.currentChallengeTimer % 5000 < 100) {
                    this.activeChallenge.windForce.x = Phaser.Math.FloatBetween(-0.0003, 0.0003)
                }
                
                // 应用风力
                if (this.scene.stickman && this.scene.stickman.body) {
                    this.scene.physics.matter.applyForce(
                        this.scene.stickman.body, 
                        this.scene.stickman.body.position, 
                        this.activeChallenge.windForce
                    )
                }
            },
            onDeactivate: function() {
                // 恢复原始空气阻力
                if (this.scene.physics.matter.world.hasOwnProperty('originalAirFriction')) {
                    this.scene.physics.matter.world.frictionAir = this.scene.physics.matter.world.originalAirFriction
                    delete this.scene.physics.matter.world.originalAirFriction
                }
            }
        }
    }

    createGravityShiftChallenge(level) {
        return {
            name: '重力变换挑战',
            description: '重力会周期性变化，适应新环境！',
            level: level,
            originalGravity: null,
            onActivate: function() {
                // 保存原始重力
                this.activeChallenge.originalGravity = this.scene.physics.matter.world.gravity.y
            },
            onUpdate: function() {
                // 周期性改变重力
                if (this.currentChallengeTimer % 3000 < 100) {
                    const gravityFactor = Phaser.Math.FloatBetween(0.5, 1.5)
                    this.scene.physics.matter.world.gravity.y = this.activeChallenge.originalGravity * gravityFactor
                }
            },
            onDeactivate: function() {
                // 恢复原始重力
                if (this.activeChallenge.originalGravity !== null) {
                    this.scene.physics.matter.world.gravity.y = this.activeChallenge.originalGravity
                }
            }
        }
    }

    update(delta) {
        // 更新挑战计时器
        if (this.activeChallenge && this.currentChallengeTimer > 0) {
            this.currentChallengeTimer -= delta
            
            // 更新挑战效果
            if (this.activeChallenge.onUpdate) {
                this.activeChallenge.onUpdate.call(this)
            }
            
            // 挑战结束
            if (this.currentChallengeTimer <= 0) {
                this.deactivateCurrentChallenge()
            }
        }
        
        // 更新体力
        this.updateStamina(delta)
        
        // 更新安全网能量
        this.updateSafetyNet(delta)
    }

    updateStamina(delta) {
        // 根据游戏状态更新体力
        if (this.scene.stickman) {
            const stickman = this.scene.stickman
            
            // 连续操作会消耗体力
            if (stickman.isJumping || stickman.isClimbing) {
                this.stamina -= this.staminaDepletionRate * delta * 0.05
            } else if (stickman.isGrounded) {
                // 静止不动时恢复体力
                this.stamina += this.staminaRegenRate * delta * 0.05
            }
        }
        
        // 限制体力值
        this.stamina = Phaser.Math.Clamp(this.stamina, 0, this.maxStamina)
        
        // 更新火柴人体力状态
        this.applyStaminaEffects()
    }

    applyStaminaEffects() {
        // 根据体力影响操作精度
        if (this.scene.stickman) {
            const stickman = this.scene.stickman
            const staminaRatio = this.stamina / this.maxStamina
            
            // 体力低时降低操作精度
            if (staminaRatio < 0.3) {
                // 增加身体晃动效果
                if (!stickman.hasLowStaminaEffect) {
                    stickman.hasLowStaminaEffect = true
                    this.scene.tweens.add({
                        targets: stickman.sprite,
                        x: `+=${Phaser.Math.Between(-2, 2)}`,
                        y: `+=${Phaser.Math.Between(-2, 2)}`,
                        duration: 100,
                        repeat: -1,
                        yoyo: true,
                        onUpdate: () => {
                            // 确保物理位置跟随视觉效果
                            stickman.body.position.x = stickman.sprite.x
                            stickman.body.position.y = stickman.sprite.y
                        }
                    })
                }
            } else {
                // 移除效果
                if (stickman.hasLowStaminaEffect) {
                    stickman.hasLowStaminaEffect = false
                    this.scene.tweens.killTweensOf(stickman.sprite)
                }
            }
        }
    }

    updateSafetyNet(delta) {
        // 从火柴人获取安全网能量
        if (this.scene.stickman) {
            this.safetyNetCharge = this.scene.stickman.getSafetyNetCharge()
        }
    }

    hasSafetyNet() {
        // 检查是否有可用的安全网
        return this.safetyNetCharge >= this.safetyNetThreshold
    }

    useSafetyNet() {
        // 使用安全网
        if (this.hasSafetyNet()) {
            this.safetyNetCharge -= this.safetyNetThreshold
            return true
        }
        return false
    }

    getSafetyNetPercentage() {
        // 返回安全网能量百分比
        return (this.safetyNetCharge / this.maxSafetyNetCharge) * 100
    }

    getStaminaPercentage() {
        // 返回体力百分比
        return (this.stamina / this.maxStamina) * 100
    }

    registerMistake() {
        // 记录失误
        this.performanceData.mistakes++
        
        // 失误会降低体力
        this.stamina -= 10
        
        // 更新成功率
        this.updateSuccessRate()
    }

    updateSuccessRate() {
        // 计算成功率
        const totalAttempts = this.performanceData.totalAttempts || 1
        this.performanceData.successRate = ((totalAttempts - this.performanceData.mistakes) / totalAttempts) * 100
    }

    recordCompletionTime() {
        // 记录完成时间
        const currentTime = Date.now()
        const completionTime = (currentTime - this.performanceData.startTime) / 1000
        
        // 更新最佳时间
        if (completionTime < this.performanceData.bestTime) {
            this.performanceData.bestTime = completionTime
        }
        
        // 记录最后完成时间
        this.performanceData.lastCompletionTime = completionTime
        
        // 保存游戏数据
        this.saveGameData()
        
        return completionTime
    }

    startNewAttempt() {
        // 开始新的尝试
        this.performanceData.totalAttempts++
        this.performanceData.startTime = Date.now()
        this.performanceData.mistakes = 0
        
        // 重置游戏状态
        this.currentLevel = 0
        this.stamina = this.maxStamina
        
        // 保存游戏数据
        this.saveGameData()
    }

    getPerformanceStats() {
        // 返回性能统计数据
        return {
            ...this.performanceData,
            currentLevel: this.currentLevel,
            safetyNetPercentage: this.getSafetyNetPercentage(),
            staminaPercentage: this.getStaminaPercentage(),
            unlockedAbilities: Object.keys(this.abilities).filter(key => this.abilities[key].unlocked)
        }
    }

    resetGameData() {
        // 重置游戏数据
        this.performanceData = {
            startTime: Date.now(),
            bestTime: Infinity,
            totalAttempts: 0,
            successRate: 0,
            lastCompletionTime: 0,
            mistakes: 0
        }
        
        // 重置能力解锁状态
        for (const key in this.abilities) {
            this.abilities[key].unlocked = false
        }
        
        // 清除localStorage
        localStorage.removeItem('climb100floors_data')
        
        // 重置游戏状态
        this.currentLevel = 0
        this.safetyNetCharge = 0
        this.stamina = this.maxStamina
    }
}
