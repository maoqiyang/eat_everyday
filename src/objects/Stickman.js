import Phaser from 'phaser'

// 火柴人角色类
export class Stickman {
    constructor(scene, x, y) {
        this.scene = scene
        this.x = x
        this.y = y
        this.sprite = null
        this.body = null
        this.leftArm = null
        this.rightArm = null
        this.leftLeg = null
        this.rightLeg = null
        this.jointConstraints = []
        this.isJumping = false
        this.jumpChargeTime = 0
        this.maxJumpChargeTime = 1000
        this.isCharging = false
        this.jumpForce = 0
        this.currentFloor = 0
        this.energy = 100
        this.maxEnergy = 100
        this.energyRegenRate = 0.02
        this.energyDepletionRate = 0.05
        this.facingDirection = 1 // 1 表示右侧，-1 表示左侧
        this.isFalling = false
        this.isClimbing = false
        this.safetyNetCharge = 0
        this.maxSafetyNetCharge = 100
        this.safetyNetThreshold = 80
        this.events = new Phaser.Events.EventEmitter()
        this.abilities = {
            doubleJump: false,
            wallClimb: false,
            ropeSwing: false
        }
        this.jumpCount = 0
        this.maxJumps = 1
        this.canWallJump = false
        this.wallNormal = null
        this.wallContactTime = 0
        this.wallSlideSpeed = 2
        this.animationState = 'idle'
        this.muscleStretchEffects = []
        this.sweatParticles = null
        this.isGrounded = false
        this.lastGroundedY = y
        
        // 初始化火柴人
        this.init()
    }

    init() {
        // 创建火柴人的物理身体
        this.createPhysicsBody()
        
        // 创建四肢
        this.createLimbs()
        
        // 创建关节约束
        this.createJoints()
        
        // 创建粒子系统
        this.createParticleSystems()
        
        // 创建动画
        this.createAnimations()
    }

    createPhysicsBody() {
        // 创建主身体（圆形）
        this.body = this.scene.matter.add.circle(this.x, this.y, 20, {
            density: 0.005,
            friction: 0.1,
            frictionAir: 0.01,
            restitution: 0.2
        })
        
        // 设置主身体的显示对象
        this.sprite = this.scene.add.circle(this.x, this.y, 20, 0xffffff)
        this.sprite.setStrokeStyle(2, 0x000000)
        
        // 眼睛
        this.eyeLeft = this.scene.add.circle(this.x - 6, this.y - 4, 3, 0x000000)
        this.eyeRight = this.scene.add.circle(this.x + 6, this.y - 4, 3, 0x000000)
        
        // 确保显示对象跟随物理对象移动
        this.body.gameObject = this.sprite
    }

    createLimbs() {
        // 创建手臂和腿部（矩形）
        const limbOptions = {
            density: 0.001,
            friction: 0.1,
            frictionAir: 0.01,
            restitution: 0.1
        }
        
        // 左手臂
        this.leftArm = this.scene.matter.add.rectangle(this.x - 30, this.y - 10, 10, 30, limbOptions)
        this.leftArmSprite = this.scene.add.rectangle(this.x - 30, this.y - 10, 10, 30, 0xffffff)
        this.leftArmSprite.setStrokeStyle(2, 0x000000)
        this.leftArm.gameObject = this.leftArmSprite
        
        // 右手臂
        this.rightArm = this.scene.matter.add.rectangle(this.x + 30, this.y - 10, 10, 30, limbOptions)
        this.rightArmSprite = this.scene.add.rectangle(this.x + 30, this.y - 10, 10, 30, 0xffffff)
        this.rightArmSprite.setStrokeStyle(2, 0x000000)
        this.rightArm.gameObject = this.rightArmSprite
        
        // 左腿
        this.leftLeg = this.scene.matter.add.rectangle(this.x - 15, this.y + 30, 10, 40, limbOptions)
        this.leftLegSprite = this.scene.add.rectangle(this.x - 15, this.y + 30, 10, 40, 0xffffff)
        this.leftLegSprite.setStrokeStyle(2, 0x000000)
        this.leftLeg.gameObject = this.leftLegSprite
        
        // 右腿
        this.rightLeg = this.scene.matter.add.rectangle(this.x + 15, this.y + 30, 10, 40, limbOptions)
        this.rightLegSprite = this.scene.add.rectangle(this.x + 15, this.y + 30, 10, 40, 0xffffff)
        this.rightLegSprite.setStrokeStyle(2, 0x000000)
        this.rightLeg.gameObject = this.rightLegSprite
    }

    createJoints() {
        // 创建身体与四肢的旋转关节
        const jointOptions = {
            stiffness: 0.1,
            damping: 0.05
        }
        
        // 左手臂关节
        this.jointConstraints.push(this.scene.matter.add.joint(
            this.body, 
            this.leftArm, 
            20, 
            0.5,
            jointOptions
        ))
        
        // 右手臂关节
        this.jointConstraints.push(this.scene.matter.add.joint(
            this.body, 
            this.rightArm, 
            20, 
            0.5,
            jointOptions
        ))
        
        // 左腿关节
        this.jointConstraints.push(this.scene.matter.add.joint(
            this.body, 
            this.leftLeg, 
            30, 
            0.5,
            jointOptions
        ))
        
        // 右腿关节
        this.jointConstraints.push(this.scene.matter.add.joint(
            this.body, 
            this.rightLeg, 
            30, 
            0.5,
            jointOptions
        ))
    }

    createParticleSystems() {
        // 创建汗水粒子系统
        this.sweatParticles = this.scene.add.particles('sweat')
        this.sweatEmitter = this.sweatParticles.createEmitter({
            x: this.x, 
            y: this.y - 20,
            speed: { min: -20, max: 20 },
            angle: { min: -100, max: -80 },
            scale: { start: 0.5, end: 0 },
            alpha: { start: 0.8, end: 0 },
            blendMode: 'NORMAL',
            frequency: 100,
            active: false
        })
    }

    createAnimations() {
        // 创建火柴人的动画状态机
        this.animationState = 'idle'
    }

    update(delta) {
        // 更新显示对象位置
        this.updateDisplayPositions()
        
        // 更新物理状态
        this.updatePhysicsState(delta)
        
        // 更新能量
        this.updateEnergy(delta)
        
        // 检查楼层进度
        this.checkFloorProgress()
        
        // 更新粒子系统
        this.updateParticleSystems()
        
        // 检查碰撞
        this.checkCollisions()
    }

    updateDisplayPositions() {
        // 同步物理对象和显示对象的位置
        if (this.sprite && this.body) {
            this.sprite.x = this.body.position.x
            this.sprite.y = this.body.position.y
            this.sprite.rotation = this.body.angle
            
            // 更新眼睛位置
            this.eyeLeft.x = this.body.position.x - 6 * this.facingDirection
            this.eyeLeft.y = this.body.position.y - 4
            this.eyeRight.x = this.body.position.x + 6 * this.facingDirection
            this.eyeRight.y = this.body.position.y - 4
        }
        
        // 更新四肢位置
        if (this.leftArmSprite && this.leftArm) {
            this.leftArmSprite.x = this.leftArm.position.x
            this.leftArmSprite.y = this.leftArm.position.y
            this.leftArmSprite.rotation = this.leftArm.angle
        }
        
        if (this.rightArmSprite && this.rightArm) {
            this.rightArmSprite.x = this.rightArm.position.x
            this.rightArmSprite.y = this.rightArm.position.y
            this.rightArmSprite.rotation = this.rightArm.angle
        }
        
        if (this.leftLegSprite && this.leftLeg) {
            this.leftLegSprite.x = this.leftLeg.position.x
            this.leftLegSprite.y = this.leftLeg.position.y
            this.leftLegSprite.rotation = this.leftLeg.angle
        }
        
        if (this.rightLegSprite && this.rightLeg) {
            this.rightLegSprite.x = this.rightLeg.position.x
            this.rightLegSprite.y = this.rightLeg.position.y
            this.rightLegSprite.rotation = this.rightLeg.angle
        }
    }

    updatePhysicsState(delta) {
        // 检测是否在下落
        if (this.body.velocity.y > 5) {
            this.isFalling = true
        } else {
            this.isFalling = false
        }
        
        // 墙壁攀爬逻辑
        if (this.abilities.wallClimb && this.canWallJump) {
            // 墙壁滑动减速
            if (this.body.velocity.y > this.wallSlideSpeed) {
                this.body.velocity.y = this.wallSlideSpeed
            }
        }
        
        // 更新蓄力跳跃
        if (this.isCharging) {
            this.jumpChargeTime += delta
            if (this.jumpChargeTime > this.maxJumpChargeTime) {
                this.jumpChargeTime = this.maxJumpChargeTime
            }
            this.jumpForce = this.calculateJumpForce()
        }
        
        // 限制最大速度
        const maxSpeed = 10
        this.body.velocity.x = Phaser.Math.Clamp(this.body.velocity.x, -maxSpeed, maxSpeed)
        this.body.velocity.y = Phaser.Math.Clamp(this.body.velocity.y, -maxSpeed * 2, maxSpeed * 2)
    }

    updateEnergy(delta) {
        // 根据动作消耗或恢复能量
        if (this.isClimbing || this.isCharging) {
            this.energy -= this.energyDepletionRate
        } else if (this.isGrounded && !this.isJumping) {
            this.energy += this.energyRegenRate
        }
        
        // 限制能量值
        this.energy = Phaser.Math.Clamp(this.energy, 0, this.maxEnergy)
    }

    checkFloorProgress() {
        // 检查是否到达新楼层
        const newFloor = Math.floor((this.scene.sys.game.config.height - this.body.position.y) / 150)
        if (newFloor > this.currentFloor) {
            this.currentFloor = newFloor
            this.events.emit('floorReached', this.currentFloor)
            
            // 增加安全网能量
            this.safetyNetCharge += 10
            if (this.safetyNetCharge > this.maxSafetyNetCharge) {
                this.safetyNetCharge = this.maxSafetyNetCharge
            }
        }
        
        // 检查是否坠落
        if (this.body.position.y > this.scene.sys.game.config.height + 200) {
            this.events.emit('fell')
        }
    }

    updateParticleSystems() {
        // 更新汗水粒子发射器位置
        if (this.sweatEmitter) {
            this.sweatEmitter.setPosition(this.body.position.x, this.body.position.y - 20)
            
            // 根据能量状态激活或停用汗水粒子
            if (this.energy < 30) {
                this.sweatEmitter.active = true
            } else {
                this.sweatEmitter.active = false
            }
        }
    }

    checkCollisions() {
        // 检测与地面的碰撞
        const bodies = this.scene.matter.world.localWorld.bodies
        let grounded = false
        let wallContact = false
        
        for (let i = 0; i < bodies.length; i++) {
            const body = bodies[i]
            
            // 跳过自己的身体和四肢
            if (body === this.body || 
                body === this.leftArm || 
                body === this.rightArm || 
                body === this.leftLeg || 
                body === this.rightLeg) {
                continue
            }
            
            // 检查碰撞
            const collision = Phaser.Physics.Matter.Matter.SAT.collides(this.body, body)
            if (collision.collided) {
                // 检测是否是地面碰撞
                const normalY = collision.collision.normal.y
                if (normalY < -0.5) {
                    grounded = true
                    this.lastGroundedY = this.body.position.y
                    
                    // 重置跳跃计数
                    this.jumpCount = 0
                    
                    // 停止跳跃状态
                    this.isJumping = false
                }
                
                // 检测是否是墙壁碰撞
                const normalX = collision.collision.normal.x
                if (Math.abs(normalX) > 0.7) {
                    wallContact = true
                    this.wallNormal = normalX
                    this.wallContactTime = 0
                }
            }
        }
        
        this.isGrounded = grounded
        this.canWallJump = wallContact && !grounded
    }

    // 控制方法
    controlLeftArm() {
        if (this.energy <= 0) return
        
        // 应用力到左手臂
        const force = new Phaser.Math.Vector2(-this.facingDirection * 0.002, -0.003)
        this.scene.matter.applyForce(this.leftArm, this.leftArm.position, force)
        
        // 消耗能量
        this.energy -= 0.5
        
        // 添加肌肉拉伸效果
        this.addMuscleStretchEffect(this.leftArm)
    }

    controlRightArm() {
        if (this.energy <= 0) return
        
        // 应用力到右手臂
        const force = new Phaser.Math.Vector2(this.facingDirection * 0.002, -0.003)
        this.scene.matter.applyForce(this.rightArm, this.rightArm.position, force)
        
        // 消耗能量
        this.energy -= 0.5
        
        // 添加肌肉拉伸效果
        this.addMuscleStretchEffect(this.rightArm)
    }

    controlLeftLeg() {
        if (this.energy <= 0) return
        
        // 应用力到左腿
        const force = new Phaser.Math.Vector2(-this.facingDirection * 0.002, -0.004)
        this.scene.matter.applyForce(this.leftLeg, this.leftLeg.position, force)
        
        // 消耗能量
        this.energy -= 0.5
        
        // 添加肌肉拉伸效果
        this.addMuscleStretchEffect(this.leftLeg)
    }

    controlRightLeg() {
        if (this.energy <= 0) return
        
        // 应用力到右腿
        const force = new Phaser.Math.Vector2(this.facingDirection * 0.002, -0.004)
        this.scene.matter.applyForce(this.rightLeg, this.rightLeg.position, force)
        
        // 消耗能量
        this.energy -= 0.5
        
        // 添加肌肉拉伸效果
        this.addMuscleStretchEffect(this.rightLeg)
    }

    startChargingJump() {
        if (!this.isGrounded && !this.canWallJump) return
        
        this.isCharging = true
        this.jumpChargeTime = 0
    }

    releaseJump() {
        if (!this.isCharging) return
        
        // 计算跳跃力
        const jumpForce = this.calculateJumpForce()
        
        // 应用跳跃力
        if (this.isGrounded) {
            // 地面跳跃
            this.body.velocity.y = -jumpForce
            this.body.velocity.x = this.facingDirection * jumpForce * 0.3
        } else if (this.canWallJump && this.abilities.wallClimb) {
            // 墙壁跳跃
            this.body.velocity.y = -jumpForce * 0.8
            this.body.velocity.x = -this.wallNormal * jumpForce * 0.5
            this.facingDirection = -this.wallNormal
        }
        
        // 检查是否可以二段跳
        if (this.abilities.doubleJump && this.jumpCount < this.maxJumps) {
            this.jumpCount++
        }
        
        this.isJumping = true
        this.isCharging = false
        
        // 消耗能量
        this.energy -= 10
    }

    calculateJumpForce() {
        // 基于蓄力时间计算跳跃力
        const chargeRatio = this.jumpChargeTime / this.maxJumpChargeTime
        return 8 + chargeRatio * 12
    }

    addMuscleStretchEffect(limb) {
        // 创建肌肉拉伸视觉效果
        const stretchEffect = this.scene.add.line(
            limb.position.x, 
            limb.position.y,
            0, 0, 20, 0,
            0xff0000,
            0.7
        )
        stretchEffect.rotation = limb.angle
        
        // 添加到效果数组
        this.muscleStretchEffects.push(stretchEffect)
        
        // 设置效果消失动画
        this.scene.tweens.add({
            targets: stretchEffect,
            alpha: 0,
            duration: 200,
            onComplete: () => {
                stretchEffect.destroy()
                const index = this.muscleStretchEffects.indexOf(stretchEffect)
                if (index > -1) {
                    this.muscleStretchEffects.splice(index, 1)
                }
            }
        })
    }

    // 能力解锁方法
    unlockAbility(abilityName) {
        if (this.abilities[abilityName] !== undefined) {
            this.abilities[abilityName] = true
            
            // 根据解锁的能力设置相应属性
            if (abilityName === 'doubleJump') {
                this.maxJumps = 2
            }
        }
    }

    // 重生方法
    respawn() {
        // 重置位置
        this.body.position.x = this.scene.sys.game.config.width / 2
        this.body.position.y = this.lastGroundedY - 50
        
        // 重置速度
        this.body.velocity.x = 0
        this.body.velocity.y = 0
        
        // 重置状态
        this.isJumping = false
        this.jumpCount = 0
        this.gameOver = false
    }

    // 获取当前状态方法
    getEnergy() {
        return this.energy
    }

    getSafetyNetCharge() {
        return this.safetyNetCharge
    }

    getCurrentFloor() {
        return this.currentFloor
    }

    // 事件监听方法
    on(event, callback, context) {
        this.events.on(event, callback, context)
    }

    off(event, callback, context) {
        this.events.off(event, callback, context)
    }
}
