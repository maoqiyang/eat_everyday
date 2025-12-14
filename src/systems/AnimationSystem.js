import Phaser from 'phaser'

// 动画系统类
export class AnimationSystem {
    constructor(scene) {
        this.scene = scene
        this.stickman = null
        this.sweatParticles = null
        this.strainLines = []
        this.jumpTrails = []
        this.isActive = true
        
        // 初始化动画系统
        this.init()
    }

    init() {
        // 创建汗水粒子系统
        this.createSweatParticles()
        
        // 注册更新函数
        this.scene.events.on('update', this.update, this)
    }

    setStickman(stickman) {
        this.stickman = stickman
    }

    createSweatParticles() {
        // 配置汗水粒子
        const sweatConfig = {
            key: 'sweat',
            type: Phaser.AUTO,
            gravityX: 0,
            gravityY: -100,
            speedX: {
                min: -20,
                max: 20
            },
            speedY: {
                min: -50,
                max: -100
            },
            lifespan: {
                min: 300,
                max: 600
            },
            alpha: {
                start: 1,
                end: 0
            },
            scale: {
                start: 0.5,
                end: 0
            },
            blendMode: Phaser.BlendModes.NORMAL
        }
        
        // 创建粒子发射器
        this.sweatParticles = this.scene.add.particles('sweat')
        
        // 创建发射器
        this.sweatEmitter = this.sweatParticles.createEmitter(sweatConfig)
        this.sweatEmitter.stop()
    }

    // 绘制肌肉拉伸效果
    createMuscleStrainEffect() {
        if (!this.stickman || !this.stickman.bodyParts) {
            return
        }
        
        // 清除旧的肌肉线条
        this.clearStrainLines()
        
        const bodyParts = this.stickman.bodyParts
        
        // 绘制手臂肌肉拉伸效果
        this.createStrainLine(bodyParts.leftArm.start, bodyParts.leftArm.end, 0xFF0000, this.stickman.armStrain.left)
        this.createStrainLine(bodyParts.rightArm.start, bodyParts.rightArm.end, 0xFF0000, this.stickman.armStrain.right)
        
        // 绘制腿部肌肉拉伸效果
        this.createStrainLine(bodyParts.leftLeg.start, bodyParts.leftLeg.end, 0x0000FF, this.stickman.legStrain.left)
        this.createStrainLine(bodyParts.rightLeg.start, bodyParts.rightLeg.end, 0x0000FF, this.stickman.legStrain.right)
    }

    createStrainLine(startPoint, endPoint, color, intensity) {
        // 根据紧张程度调整线条粗细和可见度
        const minWidth = 0.5
        const maxWidth = 3
        const width = minWidth + (maxWidth - minWidth) * intensity
        
        if (intensity > 0.1) {
            const graphics = this.scene.add.graphics()
            graphics.lineStyle(width, color, 0.8 * intensity)
            graphics.beginPath()
            graphics.moveTo(startPoint.x, startPoint.y)
            graphics.lineTo(endPoint.x, endPoint.y)
            graphics.strokePath()
            graphics.closePath()
            
            this.strainLines.push(graphics)
        }
    }

    clearStrainLines() {
        for (let i = 0; i < this.strainLines.length; i++) {
            if (this.strainLines[i]) {
                this.strainLines[i].destroy()
            }
        }
        this.strainLines = []
    }

    // 生成汗水粒子
    emitSweat() {
        if (!this.stickman || !this.sweatEmitter) {
            return
        }
        
        // 获取角色头部位置
        const headPosition = this.stickman.getHeadPosition()
        
        // 根据角色紧张程度调整汗水粒子数量
        const intensity = Math.max(this.stickman.stressLevel, 0.2)
        const particleCount = Math.floor(intensity * 5)
        
        // 发射汗水粒子
        this.sweatEmitter.setPosition(headPosition.x, headPosition.y - 10)
        this.sweatEmitter.explode(particleCount)
    }

    // 创建跳跃轨迹
    createJumpTrail() {
        if (!this.stickman || !this.stickman.isJumping) {
            return
        }
        
        const bodyPosition = this.stickman.getBodyPosition()
        
        // 创建轨迹粒子
        const trailParticles = this.scene.add.particles('trail')
        const trailEmitter = trailParticles.createEmitter({
            x: bodyPosition.x,
            y: bodyPosition.y + 20,
            speedY: 10,
            speedX: 0,
            lifespan: 300,
            alpha: {
                start: 0.5,
                end: 0
            },
            scale: {
                start: 1,
                end: 0
            },
            blendMode: Phaser.BlendModes.NORMAL,
            tint: 0xFFFFFF
        })
        
        // 存储轨迹粒子以便后续清理
        this.jumpTrails.push({ particles: trailParticles, emitter: trailEmitter })
        
        // 设置粒子持续时间
        this.scene.time.delayedCall(500, () => {
            trailEmitter.stop()
        })
        
        this.scene.time.delayedCall(800, () => {
            trailParticles.destroy()
        })
    }

    // 清理跳跃轨迹
    clearJumpTrails() {
        for (let i = this.jumpTrails.length - 1; i >= 0; i--) {
            const trail = this.jumpTrails[i]
            if (trail && trail.particles) {
                trail.particles.destroy()
            }
            this.jumpTrails.splice(i, 1)
        }
    }

    // 更新函数
    update() {
        if (!this.isActive || !this.stickman) {
            return
        }
        
        // 更新粒子发射器位置
        if (this.sweatEmitter) {
            const headPosition = this.stickman.getHeadPosition()
            this.sweatEmitter.setPosition(headPosition.x, headPosition.y - 10)
        }
        
        // 根据角色状态生成汗水
        if (this.stickman.stressLevel > 0.3) {
            // 计算发射间隔
            const baseInterval = 500
            const interval = baseInterval / this.stickman.stressLevel
            
            // 随机发射汗水
            if (Math.random() < (100 / interval)) {
                this.emitSweat()
            }
        }
        
        // 绘制肌肉拉伸效果
        this.createMuscleStrainEffect()
        
        // 如果在跳跃中，创建跳跃轨迹
        if (this.stickman.isJumping && Math.random() < 0.3) {
            this.createJumpTrail()
        }
        
        // 清理过期的跳跃轨迹
        this.cleanupExpiredTrails()
    }

    cleanupExpiredTrails() {
        // 简单的清理逻辑，实际项目中可能需要更复杂的跟踪
        if (this.jumpTrails.length > 10) {
            const oldTrail = this.jumpTrails.shift()
            if (oldTrail && oldTrail.particles) {
                oldTrail.particles.destroy()
            }
        }
    }

    // 触发特殊动画效果
    triggerSpecialEffect(type, params = {}) {
        switch (type) {
            case 'floorClear':
                this.floorClearEffect(params.position)
                break
            case 'abilityUnlock':
                this.abilityUnlockEffect(params.position)
                break
            case 'safetyNet':
                this.safetyNetEffect(params.position)
                break
            case 'challengeStart':
                this.challengeStartEffect(params.position)
                break
        }
    }

    // 楼层通关效果
    floorClearEffect(position) {
        // 创建粒子配置
        const particleConfig = {
            x: position.x,
            y: position.y,
            speed: {
                min: -100,
                max: 100
            },
            angle: {
                min: 0,
                max: 360
            },
            lifespan: {
                min: 500,
                max: 1000
            },
            alpha: {
                start: 1,
                end: 0
            },
            scale: {
                start: 0.5,
                end: 0
            },
            blendMode: Phaser.BlendModes.ADD
        }
        
        // 创建金色粒子
        const particles = this.scene.add.particles('goldParticle')
        const emitter = particles.createEmitter({
            ...particleConfig,
            tint: 0xFFD700
        })
        
        emitter.explode(20)
        
        // 清理粒子
        this.scene.time.delayedCall(1000, () => {
            particles.destroy()
        })
    }

    // 能力解锁效果
    abilityUnlockEffect(position) {
        // 创建光环效果
        const glow = this.scene.add.circle(position.x, position.y, 50, 0x4CAF50, 0.3)
        glow.setStrokeStyle(2, 0x4CAF50, 0.8)
        
        // 创建缩放动画
        this.scene.tweens.add({
            targets: glow,
            scale: { from: 0.5, to: 2 },
            alpha: { from: 1, to: 0 },
            duration: 1500,
            onComplete: () => {
                glow.destroy()
            }
        })
        
        // 创建粒子效果
        const particles = this.scene.add.particles('abilityParticle')
        const emitter = particles.createEmitter({
            x: position.x,
            y: position.y,
            speed: 150,
            angle: {
                min: 0,
                max: 360
            },
            lifespan: 1000,
            alpha: {
                start: 1,
                end: 0
            },
            scale: {
                start: 0.8,
                end: 0
            },
            tint: 0x4CAF50,
            blendMode: Phaser.BlendModes.ADD
        })
        
        emitter.explode(30)
        
        // 清理粒子
        this.scene.time.delayedCall(1000, () => {
            particles.destroy()
        })
    }

    // 安全网激活效果
    safetyNetEffect(position) {
        // 创建安全网视觉效果
        const netGraphics = this.scene.add.graphics()
        netGraphics.lineStyle(2, 0xFFD700, 0.8)
        
        // 绘制网格
        const size = 100
        const spacing = 10
        
        netGraphics.beginPath()
        
        // 水平线条
        for (let i = 0; i <= size; i += spacing) {
            const y = position.y - size/2 + i
            netGraphics.moveTo(position.x - size/2, y)
            netGraphics.lineTo(position.x + size/2, y)
        }
        
        // 垂直线条
        for (let i = 0; i <= size; i += spacing) {
            const x = position.x - size/2 + i
            netGraphics.moveTo(x, position.y - size/2)
            netGraphics.lineTo(x, position.y + size/2)
        }
        
        netGraphics.strokePath()
        netGraphics.closePath()
        
        // 创建淡入淡出动画
        netGraphics.alpha = 0
        
        this.scene.tweens.add({
            targets: netGraphics,
            alpha: {
                value: [0, 1, 0],
                ease: 'Sine.easeInOut'
            },
            duration: 2000,
            onComplete: () => {
                netGraphics.destroy()
            }
        })
    }

    // 挑战开始效果
    challengeStartEffect(position) {
        // 创建警告边框
        const warningBox = this.scene.add.rectangle(
            position.x,
            position.y,
            this.scene.sys.game.config.width,
            200,
            0x000000,
            0.3
        )
        warningBox.setStrokeStyle(3, 0xFF9800, 1)
        
        // 创建闪烁动画
        this.scene.tweens.add({
            targets: warningBox,
            alpha: {
                value: [0.3, 0.6, 0.3],
                ease: 'Sine.easeInOut'
            },
            duration: 1000,
            repeat: 2,
            onComplete: () => {
                warningBox.destroy()
            }
        })
    }

    // 启用/禁用动画
    setActive(active) {
        this.isActive = active
        
        if (!active) {
            this.clearStrainLines()
            this.clearJumpTrails()
            if (this.sweatEmitter) {
                this.sweatEmitter.stop()
            }
        }
    }

    // 销毁方法
    destroy() {
        this.setActive(false)
        
        // 清理所有效果
        this.clearStrainLines()
        this.clearJumpTrails()
        
        // 销毁粒子系统
        if (this.sweatParticles) {
            this.sweatParticles.destroy()
        }
        
        // 移除事件监听器
        this.scene.events.off('update', this.update, this)
    }
}
