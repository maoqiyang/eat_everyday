// 获取DOM元素
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const levelElement = document.getElementById('level');
const highScoreElement = document.getElementById('high-score');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const restartBtn = document.getElementById('restartBtn');

// 设置画布尺寸
canvas.width = 500;
canvas.height = 500;

// 游戏配置
const config = {
    gridSize: 20,
    initialSpeed: 150,
    speedIncrease: 10,
    foodScore: 10,
    specialFoodScore: 50,
    specialFoodChance: 0.2,
    specialFoodDuration: 5000
};

// 游戏状态
let gameState = {
    snake: [],
    food: {},
    specialFood: null,
    specialFoodTimer: null,
    direction: 'right',
    nextDirection: 'right',
    score: 0,
    level: 1,
    highScore: 0,
    isRunning: false,
    isPaused: false,
    gameLoop: null,
    speed: config.initialSpeed
};

// 初始化游戏
function initGame() {
    // 重置游戏状态
    gameState.snake = [
        {x: 5, y: 5},
        {x: 4, y: 5},
        {x: 3, y: 5}
    ];
    gameState.direction = 'right';
    gameState.nextDirection = 'right';
    gameState.score = 0;
    gameState.level = 1;
    gameState.speed = config.initialSpeed;
    gameState.isRunning = false;
    gameState.isPaused = false;
    gameState.specialFood = null;
    
    // 清除之前的定时器
    if (gameState.gameLoop) {
        clearInterval(gameState.gameLoop);
    }
    if (gameState.specialFoodTimer) {
        clearTimeout(gameState.specialFoodTimer);
    }
    
    // 生成食物
    generateFood();
    
    // 更新UI
    updateScore();
    updateLevel();
    drawGame();
    
    // 加载最高分
    loadHighScore();
}

// 生成食物
function generateFood() {
    let newFood;
    let isOnSnake;
    
    // 确保食物不会出现在蛇身上
    do {
        isOnSnake = false;
        newFood = {
            x: Math.floor(Math.random() * (canvas.width / config.gridSize)),
            y: Math.floor(Math.random() * (canvas.height / config.gridSize))
        };
        
        // 检查是否与蛇重叠
        for (let segment of gameState.snake) {
            if (segment.x === newFood.x && segment.y === newFood.y) {
                isOnSnake = true;
                break;
            }
        }
        
        // 检查是否与特殊食物重叠
        if (gameState.specialFood && 
            gameState.specialFood.x === newFood.x && 
            gameState.specialFood.y === newFood.y) {
            isOnSnake = true;
        }
    } while (isOnSnake);
    
    gameState.food = newFood;
    
    // 有一定几率生成特殊食物
    if (Math.random() < config.specialFoodChance && !gameState.specialFood) {
        generateSpecialFood();
    }
}

// 生成特殊食物
function generateSpecialFood() {
    let newSpecialFood;
    let isOnSnakeOrFood;
    
    // 确保特殊食物不会出现在蛇身上或普通食物上
    do {
        isOnSnakeOrFood = false;
        newSpecialFood = {
            x: Math.floor(Math.random() * (canvas.width / config.gridSize)),
            y: Math.floor(Math.random() * (canvas.height / config.gridSize)),
            createdAt: Date.now()
        };
        
        // 检查是否与蛇重叠
        for (let segment of gameState.snake) {
            if (segment.x === newSpecialFood.x && segment.y === newSpecialFood.y) {
                isOnSnakeOrFood = true;
                break;
            }
        }
        
        // 检查是否与普通食物重叠
        if (gameState.food.x === newSpecialFood.x && gameState.food.y === newSpecialFood.y) {
            isOnSnakeOrFood = true;
        }
    } while (isOnSnakeOrFood);
    
    gameState.specialFood = newSpecialFood;
    
    // 设置特殊食物消失的定时器
    if (gameState.specialFoodTimer) {
        clearTimeout(gameState.specialFoodTimer);
    }
    
    gameState.specialFoodTimer = setTimeout(() => {
        if (gameState.isRunning && !gameState.isPaused) {
            gameState.specialFood = null;
        }
    }, config.specialFoodDuration);
}

// 开始游戏
function startGame() {
    if (!gameState.isRunning) {
        gameState.isRunning = true;
        gameState.isPaused = false;
        
        // 更新按钮状态
        startBtn.disabled = true;
        pauseBtn.disabled = false;
        restartBtn.disabled = false;
        
        // 启动游戏循环
        gameState.gameLoop = setInterval(gameUpdate, gameState.speed);
    }
}

// 暂停游戏
function pauseGame() {
    if (gameState.isRunning && !gameState.isPaused) {
        gameState.isPaused = true;
        clearInterval(gameState.gameLoop);
        pauseBtn.textContent = '继续';
        drawPaused();
    } else if (gameState.isRunning && gameState.isPaused) {
        gameState.isPaused = false;
        gameState.gameLoop = setInterval(gameUpdate, gameState.speed);
        pauseBtn.textContent = '暂停';
    }
}

// 游戏更新
function gameUpdate() {
    // 更新方向
    gameState.direction = gameState.nextDirection;
    
    // 获取蛇头位置
    const head = { ...gameState.snake[0] };
    
    // 根据方向移动蛇头
    switch (gameState.direction) {
        case 'up':
            head.y -= 1;
            break;
        case 'down':
            head.y += 1;
            break;
        case 'left':
            head.x -= 1;
            break;
        case 'right':
            head.x += 1;
            break;
    }
    
    // 检查碰撞
    if (checkCollision(head)) {
        gameOver();
        return;
    }
    
    // 添加新的头部
    gameState.snake.unshift(head);
    
    // 检查是否吃到食物
    if (head.x === gameState.food.x && head.y === gameState.food.y) {
        // 增加分数
        gameState.score += config.foodScore;
        updateScore();
        
        // 检查是否升级
        checkLevelUp();
        
        // 生成新食物
        generateFood();
    }
    // 检查是否吃到特殊食物
    else if (gameState.specialFood && head.x === gameState.specialFood.x && head.y === gameState.specialFood.y) {
        // 增加分数
        gameState.score += config.specialFoodScore;
        updateScore();
        
        // 检查是否升级
        checkLevelUp();
        
        // 移除特殊食物
        gameState.specialFood = null;
        if (gameState.specialFoodTimer) {
            clearTimeout(gameState.specialFoodTimer);
        }
        
        // 生成新食物
        generateFood();
    }
    else {
        // 如果没吃到食物，移除尾部
        gameState.snake.pop();
    }
    
    // 绘制游戏
    drawGame();
}

// 检查碰撞
function checkCollision(head) {
    // 检查是否撞墙
    if (head.x < 0 || head.x >= canvas.width / config.gridSize || 
        head.y < 0 || head.y >= canvas.height / config.gridSize) {
        return true;
    }
    
    // 检查是否撞到自己
    for (let i = 1; i < gameState.snake.length; i++) {
        if (head.x === gameState.snake[i].x && head.y === gameState.snake[i].y) {
            return true;
        }
    }
    
    return false;
}

// 检查升级
function checkLevelUp() {
    const newLevel = Math.floor(gameState.score / 100) + 1;
    if (newLevel > gameState.level) {
        gameState.level = newLevel;
        gameState.speed = Math.max(config.initialSpeed - (gameState.level - 1) * config.speedIncrease, 50);
        updateLevel();
        
        // 重新设置游戏循环速度
        if (gameState.isRunning && !gameState.isPaused) {
            clearInterval(gameState.gameLoop);
            gameState.gameLoop = setInterval(gameUpdate, gameState.speed);
        }
    }
}

// 游戏结束
function gameOver() {
    gameState.isRunning = false;
    clearInterval(gameState.gameLoop);
    clearTimeout(gameState.specialFoodTimer);
    
    // 保存最高分
    saveHighScore();
    
    // 更新按钮状态
    startBtn.disabled = false;
    pauseBtn.disabled = true;
    pauseBtn.textContent = '暂停';
    
    // 绘制游戏结束画面
    drawGameOver();
}

// 绘制游戏
function drawGame() {
    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 绘制网格背景（可选）
    drawGrid();
    
    // 绘制蛇
    drawSnake();
    
    // 绘制食物
    drawFood();
    
    // 绘制特殊食物
    if (gameState.specialFood) {
        drawSpecialFood();
    }
}

// 绘制网格
function drawGrid() {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    
    // 绘制垂直线
    for (let x = 0; x <= canvas.width; x += config.gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }
    
    // 绘制水平线
    for (let y = 0; y <= canvas.height; y += config.gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
}

// 绘制蛇
function drawSnake() {
    for (let i = 0; i < gameState.snake.length; i++) {
        const segment = gameState.snake[i];
        const x = segment.x * config.gridSize;
        const y = segment.y * config.gridSize;
        
        // 蛇头特殊处理
        if (i === 0) {
            // 绘制蛇头
            ctx.fillStyle = '#4facfe';
            ctx.beginPath();
            ctx.roundRect(x, y, config.gridSize, config.gridSize, 8);
            ctx.fill();
            
            // 绘制眼睛
            ctx.fillStyle = 'white';
            const eyeSize = config.gridSize / 5;
            const eyeOffset = config.gridSize / 4;
            
            // 根据方向调整眼睛位置
            if (gameState.direction === 'right') {
                ctx.beginPath();
                ctx.arc(x + config.gridSize - eyeOffset, y + eyeOffset, eyeSize, 0, Math.PI * 2);
                ctx.arc(x + config.gridSize - eyeOffset, y + config.gridSize - eyeOffset, eyeSize, 0, Math.PI * 2);
                ctx.fill();
            } else if (gameState.direction === 'left') {
                ctx.beginPath();
                ctx.arc(x + eyeOffset, y + eyeOffset, eyeSize, 0, Math.PI * 2);
                ctx.arc(x + eyeOffset, y + config.gridSize - eyeOffset, eyeSize, 0, Math.PI * 2);
                ctx.fill();
            } else if (gameState.direction === 'up') {
                ctx.beginPath();
                ctx.arc(x + eyeOffset, y + eyeOffset, eyeSize, 0, Math.PI * 2);
                ctx.arc(x + config.gridSize - eyeOffset, y + eyeOffset, eyeSize, 0, Math.PI * 2);
                ctx.fill();
            } else if (gameState.direction === 'down') {
                ctx.beginPath();
                ctx.arc(x + eyeOffset, y + config.gridSize - eyeOffset, eyeSize, 0, Math.PI * 2);
                ctx.arc(x + config.gridSize - eyeOffset, y + config.gridSize - eyeOffset, eyeSize, 0, Math.PI * 2);
                ctx.fill();
            }
        } else {
            // 为身体分段创建渐变色
            const hue = (i * 15) % 360;
            ctx.fillStyle = `hsl(${hue}, 80%, 60%)`;
            
            // 绘制圆角矩形作为身体分段
            ctx.beginPath();
            ctx.roundRect(x, y, config.gridSize, config.gridSize, 4);
            ctx.fill();
        }
    }
}

// 绘制食物
function drawFood() {
    const x = gameState.food.x * config.gridSize;
    const y = gameState.food.y * config.gridSize;
    
    // 绘制苹果形状的食物
    ctx.fillStyle = '#ff6b6b';
    ctx.beginPath();
    ctx.arc(x + config.gridSize / 2, y + config.gridSize / 2, config.gridSize / 2 - 2, 0, Math.PI * 2);
    ctx.fill();
    
    // 绘制苹果柄
    ctx.strokeStyle = '#4caf50';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + config.gridSize / 2, y + config.gridSize / 4);
    ctx.lineTo(x + config.gridSize * 3 / 4, y + config.gridSize / 5);
    ctx.stroke();
    
    // 绘制苹果叶子
    ctx.fillStyle = '#4caf50';
    ctx.beginPath();
    ctx.ellipse(x + config.gridSize * 3 / 4, y + config.gridSize / 5, config.gridSize / 8, config.gridSize / 12, Math.PI / 4, 0, Math.PI * 2);
    ctx.fill();
}

// 绘制特殊食物
function drawSpecialFood() {
    const x = gameState.specialFood.x * config.gridSize;
    const y = gameState.specialFood.y * config.gridSize;
    const timeLeft = Math.max(0, (config.specialFoodDuration - (Date.now() - gameState.specialFood.createdAt)) / 1000);
    
    // 闪烁效果
    const alpha = 0.7 + 0.3 * Math.sin(Date.now() / 200);
    ctx.globalAlpha = alpha;
    
    // 绘制金色食物
    const gradient = ctx.createRadialGradient(
        x + config.gridSize / 2, y + config.gridSize / 2, 0,
        x + config.gridSize / 2, y + config.gridSize / 2, config.gridSize / 2
    );
    gradient.addColorStop(0, '#fff200');
    gradient.addColorStop(1, '#ffc107');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x + config.gridSize / 2, y + config.gridSize / 2, config.gridSize / 2 - 2, 0, Math.PI * 2);
    ctx.fill();
    
    // 绘制分数提示
    ctx.fillStyle = 'white';
    ctx.font = `bold ${config.gridSize / 3}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('+50', x + config.gridSize / 2, y + config.gridSize / 2);
    
    // 绘制倒计时环
    const progress = timeLeft / (config.specialFoodDuration / 1000);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x + config.gridSize / 2, y + config.gridSize / 2, config.gridSize * 2 / 3, -Math.PI / 2, -Math.PI / 2 + progress * Math.PI * 2);
    ctx.stroke();
    
    // 重置透明度
    ctx.globalAlpha = 1;
}

// 绘制暂停画面
function drawPaused() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = 'white';
    ctx.font = 'bold 40px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('游戏暂停', canvas.width / 2, canvas.height / 2);
    
    ctx.font = '20px Arial';
    ctx.fillText('点击继续按钮恢复游戏', canvas.width / 2, canvas.height / 2 + 50);
}

// 绘制游戏结束画面
function drawGameOver() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#ff6b6b';
    ctx.font = 'bold 40px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('游戏结束', canvas.width / 2, canvas.height / 2 - 50);
    
    ctx.fillStyle = 'white';
    ctx.font = '24px Arial';
    ctx.fillText(`最终得分: ${gameState.score}`, canvas.width / 2, canvas.height / 2);
    
    ctx.font = '20px Arial';
    ctx.fillText('点击开始按钮重新游戏', canvas.width / 2, canvas.height / 2 + 50);
}

// 更新分数
function updateScore() {
    scoreElement.textContent = gameState.score;
    
    // 更新最高分显示
    if (gameState.score > gameState.highScore) {
        gameState.highScore = gameState.score;
        highScoreElement.textContent = gameState.highScore;
    }
}

// 更新等级
function updateLevel() {
    levelElement.textContent = gameState.level;
}

// 保存最高分
function saveHighScore() {
    if (gameState.score > gameState.highScore) {
        gameState.highScore = gameState.score;
        localStorage.setItem('snakeHighScore', gameState.highScore);
        highScoreElement.textContent = gameState.highScore;
    }
}

// 加载最高分
function loadHighScore() {
    const savedHighScore = localStorage.getItem('snakeHighScore');
    if (savedHighScore) {
        gameState.highScore = parseInt(savedHighScore);
        highScoreElement.textContent = gameState.highScore;
    }
}

// 处理键盘输入
function handleKeyDown(event) {
    // 防止页面滚动
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(event.key)) {
        event.preventDefault();
    }
    
    // 游戏控制
    if (event.key === ' ' && gameState.isRunning) {
        pauseGame();
        return;
    }
    
    if (!gameState.isRunning) return;
    
    // 方向控制
    switch (event.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
            if (gameState.direction !== 'down') {
                gameState.nextDirection = 'up';
            }
            break;
        case 'ArrowDown':
        case 's':
        case 'S':
            if (gameState.direction !== 'up') {
                gameState.nextDirection = 'down';
            }
            break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
            if (gameState.direction !== 'right') {
                gameState.nextDirection = 'left';
            }
            break;
        case 'ArrowRight':
        case 'd':
        case 'D':
            if (gameState.direction !== 'left') {
                gameState.nextDirection = 'right';
            }
            break;
    }
}

// 添加触摸支持（移动设备）
let touchStartX = 0;
let touchStartY = 0;

function handleTouchStart(event) {
    touchStartX = event.touches[0].clientX;
    touchStartY = event.touches[0].clientY;
}

function handleTouchMove(event) {
    if (!touchStartX || !touchStartY || !gameState.isRunning || gameState.isPaused) return;
    
    event.preventDefault();
    
    const touchEndX = event.touches[0].clientX;
    const touchEndY = event.touches[0].clientY;
    
    const dx = touchEndX - touchStartX;
    const dy = touchEndY - touchStartY;
    
    // 确定滑动方向（基于哪个方向的移动距离更大）
    if (Math.abs(dx) > Math.abs(dy)) {
        // 水平滑动
        if (dx > 0 && gameState.direction !== 'left') {
            gameState.nextDirection = 'right';
        } else if (dx < 0 && gameState.direction !== 'right') {
            gameState.nextDirection = 'left';
        }
    } else {
        // 垂直滑动
        if (dy > 0 && gameState.direction !== 'up') {
            gameState.nextDirection = 'down';
        } else if (dy < 0 && gameState.direction !== 'down') {
            gameState.nextDirection = 'up';
        }
    }
    
    // 重置触摸起始位置
    touchStartX = touchEndX;
    touchStartY = touchEndY;
}

// 初始化事件监听器
function initEventListeners() {
    // 按钮事件
    startBtn.addEventListener('click', startGame);
    pauseBtn.addEventListener('click', pauseGame);
    restartBtn.addEventListener('click', () => {
        initGame();
        startGame();
    });
    
    // 键盘事件
    document.addEventListener('keydown', handleKeyDown);
    
    // 触摸事件
    canvas.addEventListener('touchstart', handleTouchStart);
    canvas.addEventListener('touchmove', handleTouchMove);
}

// 启动游戏
function start() {
    initEventListeners();
    initGame();
}

// 当页面加载完成后启动游戏
window.addEventListener('load', start);