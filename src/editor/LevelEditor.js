import Phaser from 'phaser'
import { FloorGenerator } from '../systems/FloorGenerator.js'

// 编辑器模式枚举
export const EditorMode = {
    // 选择模式
    SELECT: 'SELECT',
    // 添加平台
    ADD_PLATFORM: 'ADD_PLATFORM',
    // 添加障碍物
    ADD_OBSTACLE: 'ADD_OBSTACLE',
    // 添加特殊平台
    ADD_SPECIAL_PLATFORM: 'ADD_SPECIAL_PLATFORM',
    // 移动模式
    MOVE: 'MOVE',
    // 删除模式
    DELETE: 'DELETE',
    // 调整大小模式
    RESIZE: 'RESIZE'
}

// 平台类型枚举
export const PlatformType = {
    // 标准平台
    STANDARD: 'STANDARD',
    // 移动平台
    MOVING: 'MOVING',
    // 旋转平台
    ROTATING: 'ROTATING',
    // 消失平台
    DISAPPEARING: 'DISAPPEARING',
    // 狭窄平台
    NARROW: 'NARROW'
}

// 障碍物类型枚举
export const ObstacleType = {
    // 静态障碍物
    STATIC: 'STATIC',
    // 移动障碍物
    MOVING: 'MOVING',
    // 旋转障碍物
    ROTATING: 'ROTATING',
    // 消失障碍物
    DISAPPEARING: 'DISAPPEARING'
}

// 关卡编辑器类
export class LevelEditor {
    constructor(game) {
        this.game = game
        this.currentMode = EditorMode.SELECT
        this.currentPlatformType = PlatformType.STANDARD
        this.currentObstacleType = ObstacleType.STATIC
        this.selectedObject = null
        this.isDragging = false
        this.dragOffset = { x: 0, y: 0 }
        this.floorData = []
        this.currentFloorIndex = 0
        this.gridSize = 20
        this.showGrid = true
        this.snapToGrid = true
        
        // 初始化关卡生成器
        this.floorGenerator = new FloorGenerator(game)
        
        // 初始化编辑器
        this.init()
    }

    init() {
        // 创建UI
        this.createUI()
        
        // 创建编辑区域
        this.createEditArea()
        
        // 设置输入事件
        this.setupInputEvents()
        
        // 创建默认楼层数据
        this.createNewFloor()
    }

    createUI() {
        // 创建UI容器
        this.uiContainer = this.game.add.container(0, 0)
        this.uiContainer.setDepth(1000)
        
        // 创建顶部工具栏
        this.createToolbar()
        
        // 创建侧边栏
        this.createSidebar()
        
        // 创建属性面板
        this.createPropertyPanel()
        
        // 创建网格开关
        this.createGridToggle()
    }

    createToolbar() {
        // 工具栏背景
        const toolbar = this.game.add.rectangle(
            this.game.config.width / 2,
            30,
            this.game.config.width,
            60,
            0x333333,
            0.9
        )
        toolbar.setStrokeStyle(1, 0x666666)
        
        // 工具栏标题
        const title = this.game.add.text(
            20,
            30,
            '关卡编辑器',
            { fontSize: '18px', color: '#ffffff', fontWeight: 'bold' }
        )
        title.setOrigin(0, 0.5)
        
        // 添加模式按钮组
        this.modeButtons = {
            select: this.createToolbarButton(120, 30, '选择', this.setMode.bind(this, EditorMode.SELECT)),
            addPlatform: this.createToolbarButton(200, 30, '添加平台', this.setMode.bind(this, EditorMode.ADD_PLATFORM)),
            addObstacle: this.createToolbarButton(300, 30, '添加障碍物', this.setMode.bind(this, EditorMode.ADD_OBSTACLE)),
            move: this.createToolbarButton(420, 30, '移动', this.setMode.bind(this, EditorMode.MOVE)),
            delete: this.createToolbarButton(490, 30, '删除', this.setMode.bind(this, EditorMode.DELETE))
        }
        
        // 添加文件操作按钮
        this.fileButtons = {
            new: this.createToolbarButton(this.game.config.width - 350, 30, '新建', this.createNewLevel.bind(this)),
            save: this.createToolbarButton(this.game.config.width - 280, 30, '保存', this.saveLevel.bind(this)),
            load: this.createToolbarButton(this.game.config.width - 210, 30, '加载', this.loadLevel.bind(this)),
            export: this.createToolbarButton(this.game.config.width - 140, 30, '导出', this.exportLevel.bind(this)),
            generate: this.createToolbarButton(this.game.config.width - 70, 30, '生成', this.generateRandomFloor.bind(this))
        }
        
        // 添加到UI容器
        this.uiContainer.add(toolbar)
        this.uiContainer.add(title)
        
        // 添加按钮到容器
        Object.values(this.modeButtons).forEach(button => {
            this.uiContainer.add(button)
        })
        
        Object.values(this.fileButtons).forEach(button => {
            this.uiContainer.add(button)
        })
        
        // 添加楼层选择器
        this.createFloorSelector()
    }

    createToolbarButton(x, y, text, callback) {
        const button = this.game.add.text(
            x,
            y,
            text,
            {
                fontSize: '14px',
                color: '#ffffff',
                backgroundColor: '#555555',
                padding: { x: 10, y: 5 }
            }
        )
        button.setOrigin(0.5)
        button.setInteractive({ useHandCursor: true })
        button.on('pointerdown', callback)
        
        // 添加悬停效果
        button.on('pointerover', () => {
            button.setStyle({ backgroundColor: '#666666' })
        })
        
        button.on('pointerout', () => {
            button.setStyle({ backgroundColor: '#555555' })
        })
        
        return button
    }

    createFloorSelector() {
        // 楼层选择器背景
        const selectorBg = this.game.add.rectangle(
            this.game.config.width / 2,
            30,
            200,
            40,
            0x444444,
            0.8
        )
        
        // 楼层标签
        this.floorLabel = this.game.add.text(
            this.game.config.width / 2 - 80,
            30,
            '当前楼层:',
            { fontSize: '14px', color: '#ffffff' }
        )
        this.floorLabel.setOrigin(0, 0.5)
        
        // 楼层数字
        this.floorNumber = this.game.add.text(
            this.game.config.width / 2 + 20,
            30,
            `${this.currentFloorIndex + 1}/100`,
            { fontSize: '14px', color: '#ffffff', fontWeight: 'bold' }
        )
        this.floorNumber.setOrigin(0, 0.5)
        
        // 上一楼层按钮
        this.prevFloorButton = this.createArrowButton(
            this.game.config.width / 2 + 80,
            30,
            '<',
            this.prevFloor.bind(this)
        )
        
        // 下一楼层按钮
        this.nextFloorButton = this.createArrowButton(
            this.game.config.width / 2 + 110,
            30,
            '>',
            this.nextFloor.bind(this)
        )
        
        // 添加到UI容器
        this.uiContainer.add(selectorBg)
        this.uiContainer.add(this.floorLabel)
        this.uiContainer.add(this.floorNumber)
        this.uiContainer.add(this.prevFloorButton)
        this.uiContainer.add(this.nextFloorButton)
    }

    createArrowButton(x, y, text, callback) {
        const button = this.game.add.text(
            x,
            y,
            text,
            {
                fontSize: '14px',
                color: '#ffffff',
                backgroundColor: '#666666',
                padding: { x: 8, y: 4 }
            }
        )
        button.setOrigin(0.5)
        button.setInteractive({ useHandCursor: true })
        button.on('pointerdown', callback)
        
        // 添加悬停效果
        button.on('pointerover', () => {
            button.setStyle({ backgroundColor: '#777777' })
        })
        
        button.on('pointerout', () => {
            button.setStyle({ backgroundColor: '#666666' })
        })
        
        return button
    }

    createSidebar() {
        // 侧边栏背景
        const sidebar = this.game.add.rectangle(
            30,
            this.game.config.height / 2,
            200,
            this.game.config.height - 120,
            0x333333,
            0.9
        )
        sidebar.setStrokeStyle(1, 0x666666)
        
        // 侧边栏标题
        const title = this.game.add.text(
            130,
            100,
            '对象类型',
            { fontSize: '16px', color: '#ffffff', fontWeight: 'bold' }
        )
        title.setOrigin(0.5)
        
        // 添加平台类型选择
        const platformTitle = this.game.add.text(
            130,
            140,
            '平台类型',
            { fontSize: '14px', color: '#cccccc' }
        )
        platformTitle.setOrigin(0.5)
        
        // 平台类型按钮
        this.platformTypeButtons = {
            standard: this.createSidebarButton(130, 170, '标准平台', () => this.setPlatformType(PlatformType.STANDARD)),
            moving: this.createSidebarButton(130, 210, '移动平台', () => this.setPlatformType(PlatformType.MOVING)),
            rotating: this.createSidebarButton(130, 250, '旋转平台', () => this.setPlatformType(PlatformType.ROTATING)),
            disappearing: this.createSidebarButton(130, 290, '消失平台', () => this.setPlatformType(PlatformType.DISAPPEARING)),
            narrow: this.createSidebarButton(130, 330, '狭窄平台', () => this.setPlatformType(PlatformType.NARROW))
        }
        
        // 添加障碍物类型选择
        const obstacleTitle = this.game.add.text(
            130,
            370,
            '障碍物类型',
            { fontSize: '14px', color: '#cccccc' }
        )
        obstacleTitle.setOrigin(0.5)
        
        // 障碍物类型按钮
        this.obstacleTypeButtons = {
            static: this.createSidebarButton(130, 400, '静态障碍物', () => this.setObstacleType(ObstacleType.STATIC)),
            moving: this.createSidebarButton(130, 440, '移动障碍物', () => this.setObstacleType(ObstacleType.MOVING)),
            rotating: this.createSidebarButton(130, 480, '旋转障碍物', () => this.setObstacleType(ObstacleType.ROTATING)),
            disappearing: this.createSidebarButton(130, 520, '消失障碍物', () => this.setObstacleType(ObstacleType.DISAPPEARING))
        }
        
        // 添加到UI容器
        this.uiContainer.add(sidebar)
        this.uiContainer.add(title)
        this.uiContainer.add(platformTitle)
        this.uiContainer.add(obstacleTitle)
        
        // 添加按钮到容器
        Object.values(this.platformTypeButtons).forEach(button => {
            this.uiContainer.add(button)
        })
        
        Object.values(this.obstacleTypeButtons).forEach(button => {
            this.uiContainer.add(button)
        })
    }

    createSidebarButton(x, y, text, callback) {
        const button = this.game.add.text(
            x,
            y,
            text,
            {
                fontSize: '12px',
                color: '#ffffff',
                backgroundColor: '#555555',
                padding: { x: 8, y: 4 }
            }
        )
        button.setOrigin(0.5)
        button.setInteractive({ useHandCursor: true })
        button.on('pointerdown', callback)
        
        // 添加悬停效果
        button.on('pointerover', () => {
            button.setStyle({ backgroundColor: '#666666' })
        })
        
        button.on('pointerout', () => {
            button.setStyle({ backgroundColor: '#555555' })
        })
        
        return button
    }

    createPropertyPanel() {
        // 属性面板背景
        const panel = this.game.add.rectangle(
            this.game.config.width - 130,
            this.game.config.height / 2,
            260,
            this.game.config.height - 120,
            0x333333,
            0.9
        )
        panel.setStrokeStyle(1, 0x666666)
        
        // 属性面板标题
        const title = this.game.add.text(
            this.game.config.width - 130,
            100,
            '对象属性',
            { fontSize: '16px', color: '#ffffff', fontWeight: 'bold' }
        )
        title.setOrigin(0.5)
        
        // 属性标签和输入框
        this.propertyLabels = {
            type: this.createPropertyLabel(this.game.config.width - 240, 140, '类型:'),
            x: this.createPropertyLabel(this.game.config.width - 240, 170, 'X坐标:'),
            y: this.createPropertyLabel(this.game.config.width - 240, 200, 'Y坐标:'),
            width: this.createPropertyLabel(this.game.config.width - 240, 230, '宽度:'),
            height: this.createPropertyLabel(this.game.config.width - 240, 260, '高度:'),
            rotation: this.createPropertyLabel(this.game.config.width - 240, 290, '旋转:'),
            speed: this.createPropertyLabel(this.game.config.width - 240, 320, '速度:'),
            duration: this.createPropertyLabel(this.game.config.width - 240, 350, '持续时间:'),
            delay: this.createPropertyLabel(this.game.config.width - 240, 380, '延迟:'),
            color: this.createPropertyLabel(this.game.config.width - 240, 410, '颜色:')
        }
        
        // 初始化时禁用属性面板
        Object.values(this.propertyLabels).forEach(label => {
            label.setVisible(false)
        })
        
        // 添加到UI容器
        this.uiContainer.add(panel)
        this.uiContainer.add(title)
        
        Object.values(this.propertyLabels).forEach(label => {
            this.uiContainer.add(label)
        })
    }

    createPropertyLabel(x, y, text) {
        const label = this.game.add.text(
            x,
            y,
            text,
            { fontSize: '12px', color: '#cccccc' }
        )
        label.setOrigin(0, 0.5)
        
        return label
    }

    createGridToggle() {
        // 网格开关按钮
        this.gridToggleButton = this.game.add.text(
            250,
            this.game.config.height - 50,
            this.showGrid ? '隐藏网格' : '显示网格',
            {
                fontSize: '12px',
                color: '#ffffff',
                backgroundColor: '#555555',
                padding: { x: 10, y: 5 }
            }
        )
        this.gridToggleButton.setOrigin(0.5)
        this.gridToggleButton.setInteractive({ useHandCursor: true })
        this.gridToggleButton.on('pointerdown', this.toggleGrid.bind(this))
        
        // 网格吸附开关按钮
        this.snapToggleButton = this.game.add.text(
            350,
            this.game.config.height - 50,
            this.snapToGrid ? '禁用吸附' : '启用吸附',
            {
                fontSize: '12px',
                color: '#ffffff',
                backgroundColor: '#555555',
                padding: { x: 10, y: 5 }
            }
        )
        this.snapToggleButton.setOrigin(0.5)
        this.snapToggleButton.setInteractive({ useHandCursor: true })
        this.snapToggleButton.on('pointerdown', this.toggleSnap.bind(this))
        
        // 添加到UI容器
        this.uiContainer.add(this.gridToggleButton)
        this.uiContainer.add(this.snapToggleButton)
    }

    createEditArea() {
        // 创建编辑区域背景
        this.editArea = this.game.add.rectangle(
            this.game.config.width / 2,
            this.game.config.height / 2,
            this.game.config.width - 500,
            this.game.config.height - 120,
            0x1a1a2e,
            0.9
        )
        this.editArea.setStrokeStyle(2, 0x666666)
        
        // 创建网格线
        this.createGridLines()
        
        // 创建游戏对象容器
        this.gameObjectsContainer = this.game.add.container(
            (this.game.config.width - (this.game.config.width - 500)) / 2,
            90
        )
        
        // 添加到UI容器
        this.uiContainer.add(this.editArea)
        this.uiContainer.add(this.gameObjectsContainer)
    }

    createGridLines() {
        // 清除现有的网格线
        if (this.gridLines) {
            this.gridLines.destroy()
        }
        
        // 创建网格线图形
        this.gridLines = this.game.add.graphics()
        this.gridLines.lineStyle(1, 0x333333)
        
        // 计算编辑区域的尺寸和位置
        const editAreaWidth = this.game.config.width - 500
        const editAreaHeight = this.game.config.height - 120
        const editAreaX = (this.game.config.width - editAreaWidth) / 2
        const editAreaY = 90
        
        // 绘制垂直线
        for (let x = 0; x <= editAreaWidth; x += this.gridSize) {
            this.gridLines.lineBetween(
                editAreaX + x,
                editAreaY,
                editAreaX + x,
                editAreaY + editAreaHeight
            )
        }
        
        // 绘制水平线
        for (let y = 0; y <= editAreaHeight; y += this.gridSize) {
            this.gridLines.lineBetween(
                editAreaX,
                editAreaY + y,
                editAreaX + editAreaWidth,
                editAreaY + y
            )
        }
        
        // 设置网格线可见性
        this.gridLines.setVisible(this.showGrid)
        
        // 添加到UI容器
        this.uiContainer.add(this.gridLines)
    }

    setupInputEvents() {
        // 添加鼠标事件监听
        this.game.input.on('pointerdown', this.handlePointerDown.bind(this))
        this.game.input.on('pointermove', this.handlePointerMove.bind(this))
        this.game.input.on('pointerup', this.handlePointerUp.bind(this))
        
        // 添加键盘事件监听
        this.game.input.keyboard.on('keydown', this.handleKeyDown.bind(this))
    }

    handlePointerDown(pointer) {
        // 检查是否点击在编辑区域内
        if (!this.isPointInEditArea(pointer.x, pointer.y)) {
            return
        }
        
        // 转换为编辑区域内的相对坐标
        const relativePos = this.getRelativePosition(pointer.x, pointer.y)
        
        // 根据当前模式处理点击
        switch (this.currentMode) {
            case EditorMode.SELECT:
                this.selectObject(relativePos.x, relativePos.y)
                break
            case EditorMode.ADD_PLATFORM:
                this.addPlatform(relativePos.x, relativePos.y)
                break
            case EditorMode.ADD_OBSTACLE:
                this.addObstacle(relativePos.x, relativePos.y)
                break
            case EditorMode.MOVE:
                this.startMoveObject(relativePos.x, relativePos.y)
                break
            case EditorMode.DELETE:
                this.deleteObject(relativePos.x, relativePos.y)
                break
        }
    }

    handlePointerMove(pointer) {
        // 检查是否在编辑区域内并且正在拖动
        if (!this.isDragging || !this.isPointInEditArea(pointer.x, pointer.y)) {
            return
        }
        
        // 转换为编辑区域内的相对坐标
        const relativePos = this.getRelativePosition(pointer.x, pointer.y)
        
        // 根据当前模式处理拖动
        if (this.currentMode === EditorMode.MOVE && this.selectedObject) {
            // 计算新位置
            let newX = relativePos.x - this.dragOffset.x
            let newY = relativePos.y - this.dragOffset.y
            
            // 如果启用了网格吸附，对齐到网格
            if (this.snapToGrid) {
                newX = Math.round(newX / this.gridSize) * this.gridSize
                newY = Math.round(newY / this.gridSize) * this.gridSize
            }
            
            // 更新对象位置
            this.updateObjectPosition(this.selectedObject, newX, newY)
        }
    }

    handlePointerUp() {
        // 停止拖动
        this.isDragging = false
        this.dragOffset = { x: 0, y: 0 }
    }

    handleKeyDown(event) {
        // 删除键删除选中的对象
        if (event.key === 'Delete' && this.selectedObject) {
            this.deleteSelectedObject()
        }
        
        // 箭头键移动选中的对象
        if (this.selectedObject && this.currentMode === EditorMode.MOVE) {
            let dx = 0
            let dy = 0
            
            switch (event.key) {
                case 'ArrowUp':
                    dy = -this.gridSize
                    break
                case 'ArrowDown':
                    dy = this.gridSize
                    break
                case 'ArrowLeft':
                    dx = -this.gridSize
                    break
                case 'ArrowRight':
                    dx = this.gridSize
                    break
            }
            
            if (dx !== 0 || dy !== 0) {
                const newX = this.selectedObject.x + dx
                const newY = this.selectedObject.y + dy
                this.updateObjectPosition(this.selectedObject, newX, newY)
            }
        }
    }

    isPointInEditArea(x, y) {
        const editAreaWidth = this.game.config.width - 500
        const editAreaHeight = this.game.config.height - 120
        const editAreaX = (this.game.config.width - editAreaWidth) / 2
        const editAreaY = 90
        
        return x >= editAreaX && x <= editAreaX + editAreaWidth &&
               y >= editAreaY && y <= editAreaY + editAreaHeight
    }

    getRelativePosition(x, y) {
        const editAreaX = (this.game.config.width - (this.game.config.width - 500)) / 2
        const editAreaY = 90
        
        return {
            x: x - editAreaX,
            y: y - editAreaY
        }
    }

    setMode(mode) {
        // 更新当前模式
        this.currentMode = mode
        
        // 更新模式按钮样式
        Object.entries(this.modeButtons).forEach(([key, button]) => {
            const isActive = (mode === EditorMode.SELECT && key === 'select') ||
                           (mode === EditorMode.ADD_PLATFORM && key === 'addPlatform') ||
                           (mode === EditorMode.ADD_OBSTACLE && key === 'addObstacle') ||
                           (mode === EditorMode.MOVE && key === 'move') ||
                           (mode === EditorMode.DELETE && key === 'delete')
            
            button.setStyle({
                backgroundColor: isActive ? '#4CAF50' : '#555555'
            })
        })
        
        // 清除选中的对象
        this.deselectObject()
    }

    setPlatformType(type) {
        this.currentPlatformType = type
        
        // 更新平台类型按钮样式
        Object.entries(this.platformTypeButtons).forEach(([key, button]) => {
            const isActive = (type === PlatformType.STANDARD && key === 'standard') ||
                           (type === PlatformType.MOVING && key === 'moving') ||
                           (type === PlatformType.ROTATING && key === 'rotating') ||
                           (type === PlatformType.DISAPPEARING && key === 'disappearing') ||
                           (type === PlatformType.NARROW && key === 'narrow')
            
            button.setStyle({
                backgroundColor: isActive ? '#4CAF50' : '#555555'
            })
        })
    }

    setObstacleType(type) {
        this.currentObstacleType = type
        
        // 更新障碍物类型按钮样式
        Object.entries(this.obstacleTypeButtons).forEach(([key, button]) => {
            const isActive = (type === ObstacleType.STATIC && key === 'static') ||
                           (type === ObstacleType.MOVING && key === 'moving') ||
                           (type === ObstacleType.ROTATING && key === 'rotating') ||
                           (type === ObstacleType.DISAPPEARING && key === 'disappearing')
            
            button.setStyle({
                backgroundColor: isActive ? '#4CAF50' : '#555555'
            })
        })
    }

    selectObject(x, y) {
        // 遍历所有游戏对象，检查点击位置
        for (let i = this.gameObjectsContainer.list.length - 1; i >= 0; i--) {
            const object = this.gameObjectsContainer.list[i]
            
            // 检查是否点击在对象上
            if (object.getBounds && Phaser.Geom.Rectangle.Contains(object.getBounds(), x, y)) {
                this.deselectObject()
                this.selectedObject = object
                
                // 添加选中效果
                this.addSelectionEffect(object)
                
                // 显示对象属性
                this.showObjectProperties(object)
                
                return
            }
        }
        
        // 如果没有点击到对象，取消选择
        this.deselectObject()
    }

    deselectObject() {
        if (this.selectedObject) {
            // 移除选中效果
            this.removeSelectionEffect(this.selectedObject)
            
            // 隐藏属性面板
            this.hideObjectProperties()
            
            this.selectedObject = null
        }
    }

    addSelectionEffect(object) {
        // 创建选中边框
        if (object.selectionOutline) {
            object.selectionOutline.destroy()
        }
        
        const outline = this.game.add.graphics()
        outline.lineStyle(2, 0x00ff00)
        outline.strokeRect(-object.displayWidth / 2, -object.displayHeight / 2, object.displayWidth, object.displayHeight)
        
        // 将边框添加到对象
        object.add(outline)
        object.selectionOutline = outline
    }

    removeSelectionEffect(object) {
        if (object.selectionOutline) {
            object.selectionOutline.destroy()
            object.selectionOutline = null
        }
    }

    showObjectProperties(object) {
        // 显示所有属性标签
        Object.values(this.propertyLabels).forEach(label => {
            label.setVisible(true)
        })
        
        // 获取对象类型
        const objectType = object.data.get('type') || '未知'
        
        // 更新属性值
        this.propertyLabels.type.setText(`类型: ${objectType}`)
        this.propertyLabels.x.setText(`X坐标: ${Math.round(object.x)}`)
        this.propertyLabels.y.setText(`Y坐标: ${Math.round(object.y)}`)
        this.propertyLabels.width.setText(`宽度: ${Math.round(object.displayWidth)}`)
        this.propertyLabels.height.setText(`高度: ${Math.round(object.displayHeight)}`)
        this.propertyLabels.rotation.setText(`旋转: ${Math.round(object.rotation * 180 / Math.PI)}°`)
        
        // 如果是移动平台或障碍物，显示速度
        const speed = object.data.get('speed') || 0
        this.propertyLabels.speed.setText(`速度: ${speed}`)
        
        // 如果是消失平台或障碍物，显示持续时间和延迟
        const duration = object.data.get('duration') || 0
        const delay = object.data.get('delay') || 0
        this.propertyLabels.duration.setText(`持续时间: ${duration}`)
        this.propertyLabels.delay.setText(`延迟: ${delay}`)
        
        // 显示颜色
        const color = object.data.get('color') || '#ffffff'
        this.propertyLabels.color.setText(`颜色: ${color}`)
    }

    hideObjectProperties() {
        // 隐藏所有属性标签
        Object.values(this.propertyLabels).forEach(label => {
            label.setVisible(false)
        })
    }

    addPlatform(x, y) {
        // 如果启用了网格吸附，对齐到网格
        if (this.snapToGrid) {
            x = Math.round(x / this.gridSize) * this.gridSize
            y = Math.round(y / this.gridSize) * this.gridSize
        }
        
        // 根据平台类型创建平台
        let platform
        let platformData = {
            type: 'platform',
            platformType: this.currentPlatformType,
            x: x,
            y: y,
            width: 100,
            height: 20
        }
        
        // 设置默认宽度和高度
        switch (this.currentPlatformType) {
            case PlatformType.STANDARD:
                platformData.width = 100
                platformData.height = 20
                platformData.color = '#4CAF50'
                break
            case PlatformType.MOVING:
                platformData.width = 80
                platformData.height = 20
                platformData.speed = 50
                platformData.direction = 'horizontal'
                platformData.color = '#2196F3'
                break
            case PlatformType.ROTATING:
                platformData.width = 80
                platformData.height = 20
                platformData.rotationSpeed = 45
                platformData.color = '#FF9800'
                break
            case PlatformType.DISAPPEARING:
                platformData.width = 100
                platformData.height = 20
                platformData.duration = 2000
                platformData.delay = 1000
                platformData.color = '#9C27B0'
                break
            case PlatformType.NARROW:
                platformData.width = 40
                platformData.height = 20
                platformData.color = '#F44336'
                break
        }
        
        // 创建平台对象
        platform = this.createGameObject(platformData)
        
        // 添加到游戏对象容器
        this.gameObjectsContainer.add(platform)
        
        // 保存到楼层数据
        this.floorData[this.currentFloorIndex].platforms.push(platformData)
        
        // 选中新创建的平台
        this.selectObject(x, y)
    }

    addObstacle(x, y) {
        // 如果启用了网格吸附，对齐到网格
        if (this.snapToGrid) {
            x = Math.round(x / this.gridSize) * this.gridSize
            y = Math.round(y / this.gridSize) * this.gridSize
        }
        
        // 根据障碍物类型创建障碍物
        let obstacleData = {
            type: 'obstacle',
            obstacleType: this.currentObstacleType,
            x: x,
            y: y,
            width: 30,
            height: 30
        }
        
        // 设置默认宽度、高度和其他属性
        switch (this.currentObstacleType) {
            case ObstacleType.STATIC:
                obstacleData.width = 30
                obstacleData.height = 30
                obstacleData.color = '#F44336'
                break
            case ObstacleType.MOVING:
                obstacleData.width = 30
                obstacleData.height = 30
                obstacleData.speed = 30
                obstacleData.direction = 'vertical'
                obstacleData.color = '#FF9800'
                break
            case ObstacleType.ROTATING:
                obstacleData.width = 30
                obstacleData.height = 30
                obstacleData.rotationSpeed = 90
                obstacleData.color = '#9C27B0'
                break
            case ObstacleType.DISAPPEARING:
                obstacleData.width = 30
                obstacleData.height = 30
                obstacleData.duration = 1500
                obstacleData.delay = 1000
                obstacleData.color = '#607D8B'
                break
        }
        
        // 创建障碍物对象
        const obstacle = this.createGameObject(obstacleData)
        
        // 添加到游戏对象容器
        this.gameObjectsContainer.add(obstacle)
        
        // 保存到楼层数据
        this.floorData[this.currentFloorIndex].obstacles.push(obstacleData)
        
        // 选中新创建的障碍物
        this.selectObject(x, y)
    }

    createGameObject(data) {
        let gameObject
        
        // 创建图形对象
        const graphics = this.game.add.graphics()
        graphics.fillStyle(Phaser.Display.Color.HexStringToColor(data.color || '#ffffff').color, 0.8)
        
        // 根据对象类型创建不同形状
        if (data.type === 'platform') {
            // 平台通常是矩形
            graphics.fillRect(-data.width / 2, -data.height / 2, data.width, data.height)
        } else if (data.type === 'obstacle') {
            // 障碍物默认是圆形
            graphics.fillCircle(0, 0, Math.max(data.width, data.height) / 2)
        }
        
        // 生成纹理
        const textureKey = `${data.type}-${Date.now()}`
        graphics.generateTexture(textureKey, data.width, data.height)
        graphics.destroy()
        
        // 创建精灵对象
        gameObject = this.game.add.sprite(data.x, data.y, textureKey)
        
        // 设置显示尺寸
        gameObject.displayWidth = data.width
        gameObject.displayHeight = data.height
        
        // 添加数据
        gameObject.setDataEnabled()
        Object.entries(data).forEach(([key, value]) => {
            gameObject.data.set(key, value)
        })
        
        return gameObject
    }

    startMoveObject(x, y) {
        // 选择对象
        this.selectObject(x, y)
        
        // 如果选中了对象，开始拖动
        if (this.selectedObject) {
            this.isDragging = true
            this.dragOffset = {
                x: x - this.selectedObject.x,
                y: y - this.selectedObject.y
            }
        }
    }

    updateObjectPosition(object, x, y) {
        // 更新对象位置
        object.x = x
        object.y = y
        
        // 更新数据
        object.data.set('x', x)
        object.data.set('y', y)
        
        // 更新楼层数据
        this.updateFloorData()
        
        // 更新属性面板
        if (this.selectedObject === object) {
            this.showObjectProperties(object)
        }
    }

    deleteObject(x, y) {
        // 选择对象
        this.selectObject(x, y)
        
        // 如果选中了对象，删除它
        if (this.selectedObject) {
            this.deleteSelectedObject()
        }
    }

    deleteSelectedObject() {
        if (!this.selectedObject) {
            return
        }
        
        // 获取对象数据
        const objectData = this.selectedObject.data.getAll()
        
        // 从游戏对象容器中移除
        this.gameObjectsContainer.remove(this.selectedObject, true)
        
        // 从楼层数据中移除
        if (objectData.type === 'platform') {
            const platformIndex = this.floorData[this.currentFloorIndex].platforms.findIndex(
                platform => platform.x === objectData.x && platform.y === objectData.y
            )
            if (platformIndex !== -1) {
                this.floorData[this.currentFloorIndex].platforms.splice(platformIndex, 1)
            }
        } else if (objectData.type === 'obstacle') {
            const obstacleIndex = this.floorData[this.currentFloorIndex].obstacles.findIndex(
                obstacle => obstacle.x === objectData.x && obstacle.y === objectData.y
            )
            if (obstacleIndex !== -1) {
                this.floorData[this.currentFloorIndex].obstacles.splice(obstacleIndex, 1)
            }
        }
        
        // 取消选择
        this.deselectObject()
    }

    toggleGrid() {
        this.showGrid = !this.showGrid
        this.gridToggleButton.setText(this.showGrid ? '隐藏网格' : '显示网格')
        this.gridLines.setVisible(this.showGrid)
    }

    toggleSnap() {
        this.snapToGrid = !this.snapToGrid
        this.snapToggleButton.setText(this.snapToGrid ? '禁用吸附' : '启用吸附')
    }

    createNewFloor() {
        // 确保floorData数组有足够的空间
        while (this.floorData.length <= this.currentFloorIndex) {
            this.floorData.push({
                platforms: [],
                obstacles: [],
                specialEffects: [],
                difficulty: this.calculateFloorDifficulty(this.floorData.length + 1)
            })
        }
        
        // 加载当前楼层数据
        this.loadFloorData(this.currentFloorIndex)
        
        // 更新楼层显示
        this.updateFloorDisplay()
    }

    calculateFloorDifficulty(floorNumber) {
        // 前30层简单，中间40层中等，后30层困难
        if (floorNumber <= 30) {
            return 'easy'
        } else if (floorNumber <= 70) {
            return 'medium'
        } else {
            return 'hard'
        }
    }

    loadFloorData(floorIndex) {
        // 清除当前的游戏对象
        this.gameObjectsContainer.removeAll(true)
        
        // 取消选择
        this.deselectObject()
        
        // 获取楼层数据
        const floor = this.floorData[floorIndex]
        if (!floor) {
            return
        }
        
        // 创建平台
        floor.platforms.forEach(platformData => {
            const platform = this.createGameObject(platformData)
            this.gameObjectsContainer.add(platform)
        })
        
        // 创建障碍物
        floor.obstacles.forEach(obstacleData => {
            const obstacle = this.createGameObject(obstacleData)
            this.gameObjectsContainer.add(obstacle)
        })
    }

    updateFloorData() {
        // 清除当前楼层的平台和障碍物数据
        this.floorData[this.currentFloorIndex].platforms = []
        this.floorData[this.currentFloorIndex].obstacles = []
        
        // 遍历游戏对象容器中的所有对象
        this.gameObjectsContainer.list.forEach(object => {
            const objectData = object.data.getAll()
            
            // 根据对象类型添加到相应的数据数组
            if (objectData.type === 'platform') {
                this.floorData[this.currentFloorIndex].platforms.push(objectData)
            } else if (objectData.type === 'obstacle') {
                this.floorData[this.currentFloorIndex].obstacles.push(objectData)
            }
        })
    }

    prevFloor() {
        if (this.currentFloorIndex > 0) {
            // 保存当前楼层数据
            this.updateFloorData()
            
            // 切换到上一楼层
            this.currentFloorIndex--
            
            // 加载上一楼层数据
            this.loadFloorData(this.currentFloorIndex)
            
            // 更新楼层显示
            this.updateFloorDisplay()
        }
    }

    nextFloor() {
        if (this.currentFloorIndex < 99) {
            // 保存当前楼层数据
            this.updateFloorData()
            
            // 切换到下一楼层
            this.currentFloorIndex++
            
            // 如果是新楼层，创建新的楼层数据
            if (this.currentFloorIndex >= this.floorData.length) {
                this.floorData.push({
                    platforms: [],
                    obstacles: [],
                    specialEffects: [],
                    difficulty: this.calculateFloorDifficulty(this.currentFloorIndex + 1)
                })
            }
            
            // 加载下一楼层数据
            this.loadFloorData(this.currentFloorIndex)
            
            // 更新楼层显示
            this.updateFloorDisplay()
        }
    }

    updateFloorDisplay() {
        // 更新楼层数字显示
        this.floorNumber.setText(`${this.currentFloorIndex + 1}/100`)
        
        // 更新难度指示器
        const difficulty = this.floorData[this.currentFloorIndex]?.difficulty || 'easy'
        let difficultyColor = '#4CAF50' // 简单 - 绿色
        
        if (difficulty === 'medium') {
            difficultyColor = '#FF9800' // 中等 - 橙色
        } else if (difficulty === 'hard') {
            difficultyColor = '#F44336' // 困难 - 红色
        }
        
        // 如果已经存在难度指示器，先移除
        if (this.difficultyIndicator) {
            this.difficultyIndicator.destroy()
        }
        
        // 创建难度指示器
        this.difficultyIndicator = this.game.add.text(
            this.game.config.width / 2 + 150,
            30,
            difficulty.toUpperCase(),
            {
                fontSize: '12px',
                color: '#ffffff',
                backgroundColor: difficultyColor,
                padding: { x: 8, y: 2 }
            }
        )
        this.difficultyIndicator.setOrigin(0.5)
        
        // 添加到UI容器
        this.uiContainer.add(this.difficultyIndicator)
    }

    generateRandomFloor() {
        // 保存当前楼层数据
        this.updateFloorData()
        
        // 使用楼层生成器生成随机楼层
        const floorData = this.floorGenerator.generateFloor(this.currentFloorIndex + 1)
        
        // 清除当前的游戏对象
        this.gameObjectsContainer.removeAll(true)
        
        // 取消选择
        this.deselectObject()
        
        // 保存生成的楼层数据
        this.floorData[this.currentFloorIndex] = floorData
        
        // 创建平台
        floorData.platforms.forEach(platformData => {
            const platform = this.createGameObject(platformData)
            this.gameObjectsContainer.add(platform)
        })
        
        // 创建障碍物
        floorData.obstacles.forEach(obstacleData => {
            const obstacle = this.createGameObject(obstacleData)
            this.gameObjectsContainer.add(obstacle)
        })
        
        console.log(`已为第${this.currentFloorIndex + 1}层生成随机关卡`)
    }

    createNewLevel() {
        // 确认对话框
        if (confirm('确定要创建新关卡吗？当前未保存的更改将会丢失。')) {
            // 重置楼层数据
            this.floorData = []
            this.currentFloorIndex = 0
            
            // 创建新的楼层数据
            this.createNewFloor()
            
            console.log('已创建新关卡')
        }
    }

    saveLevel() {
        try {
            // 保存当前楼层数据
            this.updateFloorData()
            
            // 将楼层数据转换为JSON字符串
            const levelData = JSON.stringify(this.floorData, null, 2)
            
            // 创建Blob对象
            const blob = new Blob([levelData], { type: 'application/json' })
            
            // 创建下载链接
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `stickman-level-${Date.now()}.json`
            
            // 触发下载
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            
            // 释放URL对象
            URL.revokeObjectURL(url)
            
            console.log('关卡已保存')
        } catch (error) {
            console.error('保存关卡失败:', error)
            alert('保存关卡失败，请重试。')
        }
    }

    loadLevel() {
        try {
            // 创建文件选择器
            const input = document.createElement('input')
            input.type = 'file'
            input.accept = '.json'
            
            // 设置文件选择回调
            input.onchange = (event) => {
                const file = event.target.files[0]
                if (file) {
                    const reader = new FileReader()
                    
                    reader.onload = (e) => {
                        try {
                            // 解析JSON数据
                            const loadedData = JSON.parse(e.target.result)
                            
                            // 验证数据格式
                            if (Array.isArray(loadedData)) {
                                // 保存当前楼层数据
                                this.updateFloorData()
                                
                                // 加载新数据
                                this.floorData = loadedData
                                this.currentFloorIndex = 0
                                
                                // 加载当前楼层数据
                                this.loadFloorData(this.currentFloorIndex)
                                
                                // 更新楼层显示
                                this.updateFloorDisplay()
                                
                                console.log('关卡已加载')
                            } else {
                                throw new Error('无效的关卡数据格式')
                            }
                        } catch (error) {
                            console.error('解析关卡数据失败:', error)
                            alert('解析关卡数据失败，请检查文件格式。')
                        }
                    }
                    
                    reader.readAsText(file)
                }
            }
            
            // 触发文件选择对话框
            input.click()
        } catch (error) {
            console.error('加载关卡失败:', error)
            alert('加载关卡失败，请重试。')
        }
    }

    exportLevel() {
        try {
            // 保存当前楼层数据
            this.updateFloorData()
            
            // 准备导出数据
            const exportData = {
                version: '1.0',
                exportDate: new Date().toISOString(),
                floorCount: this.floorData.length,
                floors: this.floorData
            }
            
            // 将数据转换为JSON字符串
            const jsonData = JSON.stringify(exportData, null, 2)
            
            // 创建Blob对象
            const blob = new Blob([jsonData], { type: 'application/json' })
            
            // 创建下载链接
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `stickman-export-${Date.now()}.json`
            
            // 触发下载
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            
            // 释放URL对象
            URL.revokeObjectURL(url)
            
            console.log('关卡已导出')
        } catch (error) {
            console.error('导出关卡失败:', error)
            alert('导出关卡失败，请重试。')
        }
    }

    // 导入关卡数据（供外部调用）
    importLevelData(levelData) {
        try {
            // 验证数据格式
            if (Array.isArray(levelData)) {
                // 保存当前楼层数据
                this.updateFloorData()
                
                // 加载新数据
                this.floorData = levelData
                this.currentFloorIndex = 0
                
                // 加载当前楼层数据
                this.loadFloorData(this.currentFloorIndex)
                
                // 更新楼层显示
                this.updateFloorDisplay()
                
                console.log('关卡数据已导入')
                return true
            } else {
                throw new Error('无效的关卡数据格式')
            }
        } catch (error) {
            console.error('导入关卡数据失败:', error)
            return false
        }
    }

    // 获取当前关卡数据（供外部调用）
    getLevelData() {
        // 保存当前楼层数据
        this.updateFloorData()
        
        return this.floorData
    }

    // 销毁编辑器（供外部调用）
    destroy() {
        // 保存当前楼层数据
        this.updateFloorData()
        
        // 移除所有UI元素
        this.uiContainer.destroy()
        
        // 移除事件监听
        this.game.input.off('pointerdown', this.handlePointerDown.bind(this))
        this.game.input.off('pointermove', this.handlePointerMove.bind(this))
        this.game.input.off('pointerup', this.handlePointerUp.bind(this))
        this.game.input.keyboard.off('keydown', this.handleKeyDown.bind(this))
    }
}
