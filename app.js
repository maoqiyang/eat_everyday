// Eat Everyday 应用主脚本

// 数据模型定义
class Dish {
    constructor(id, name, category, difficulty, weight = 3, tags = []) {
        this.id = id;
        this.name = name;
        this.category = category;
        this.difficulty = difficulty;
        this.weight = weight;
        this.tags = tags;
    }
}

class HistoryRecord {
    constructor(id, date, dishes) {
        this.id = id;
        this.date = date;
        this.dishes = dishes;
    }
}

// 应用核心类
class EatEverydayApp {
    constructor() {
        // 初始化数据
        this.dishes = this.loadDishes();
        this.history = this.loadHistory();
        this.currentLanguage = 'zh';
        this.translations = this.loadTranslations();
        this.currentRandomResult = null;
        
        // 初始化界面
        this.initEventListeners();
        this.renderDishList();
        this.renderHistoryList();
        this.updateNavbarScroll();
        
        // 添加模拟数据
        this.addMockData();
    }

    // 加载菜品数据
    loadDishes() {
        const stored = localStorage.getItem('eatEverydayDishes');
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                return parsed.map(dish => new Dish(
                    dish.id,
                    dish.name,
                    dish.category,
                    dish.difficulty,
                    dish.weight,
                    dish.tags
                ));
            } catch (e) {
                console.error('Failed to parse dishes from localStorage:', e);
                return [];
            }
        }
        return [];
    }

    // 保存菜品数据
    saveDishes() {
        localStorage.setItem('eatEverydayDishes', JSON.stringify(this.dishes));
    }

    // 加载历史记录
    loadHistory() {
        const stored = localStorage.getItem('eatEverydayHistory');
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                return parsed.map(record => new HistoryRecord(
                    record.id,
                    record.date,
                    record.dishes
                ));
            } catch (e) {
                console.error('Failed to parse history from localStorage:', e);
                return [];
            }
        }
        return [];
    }

    // 保存历史记录
    saveHistory() {
        localStorage.setItem('eatEverydayHistory', JSON.stringify(this.history));
    }

    // 加载翻译数据
    loadTranslations() {
        return {
            zh: {
                appName: 'Eat Everyday',
                navHome: '首页',
                navMenu: '菜单管理',
                navRandom: '随机抽取',
                navHistory: '历史记录',
                addDish: '添加新菜品',
                dishName: '菜品名称',
                category: '分类',
                difficulty: '难度等级',
                weight: '抽取权重',
                tags: '标签（可选，用逗号分隔）',
                addDishBtn: '添加菜品',
                myDishes: '我的菜品列表',
                exportData: '导出数据',
                importData: '导入数据',
                searchDish: '搜索菜品',
                filterByCategory: '按分类筛选',
                filterByDifficulty: '按难度筛选',
                noDishes: '暂无菜品',
                addFirstDish: '添加首个菜品',
                randomDraw: '随机抽取',
                randomSettings: '抽取设置',
                excludeDays: '排除最近N天已选菜品',
                dishesPerMeal: '每餐菜品数量',
                selectCategories: '选择菜品分类',
                randomResult: '抽取结果',
                redraw: '重新抽取',
                drawing: '正在随机抽取中...',
                noRandomResult: '还没有抽取结果',
                startRandom: '开始抽取',
                saveResult: '保存结果',
                shareResult: '分享结果',
                historyRecords: '历史记录',
                viewHistory: '查看和管理您的历史菜单记录',
                selectDate: '选择日期',
                noHistory: '暂无历史记录',
                editDish: '编辑菜品',
                cancel: '取消',
                saveChanges: '保存修改',
                shareMenu: '分享菜单',
                copyLink: '复制分享链接',
                success: '操作成功！',
                deleteConfirm: '确定要删除这个菜品吗？',
                exportSuccess: '数据导出成功',
                importSuccess: '数据导入成功',
                copySuccess: '链接已复制到剪贴板',
                saveResultSuccess: '结果已保存'
            },
            en: {
                appName: 'Eat Everyday',
                navHome: 'Home',
                navMenu: 'Menu Management',
                navRandom: 'Random Selection',
                navHistory: 'History',
                addDish: 'Add New Dish',
                dishName: 'Dish Name',
                category: 'Category',
                difficulty: 'Difficulty',
                weight: 'Weight',
                tags: 'Tags (optional, separated by commas)',
                addDishBtn: 'Add Dish',
                myDishes: 'My Dish List',
                exportData: 'Export Data',
                importData: 'Import Data',
                searchDish: 'Search Dishes',
                filterByCategory: 'Filter by Category',
                filterByDifficulty: 'Filter by Difficulty',
                noDishes: 'No dishes available',
                addFirstDish: 'Add First Dish',
                randomDraw: 'Random Selection',
                randomSettings: 'Selection Settings',
                excludeDays: 'Exclude dishes selected in last N days',
                dishesPerMeal: 'Number of dishes per meal',
                selectCategories: 'Select Categories',
                randomResult: 'Selection Result',
                redraw: 'Redraw',
                drawing: 'Drawing randomly...',
                noRandomResult: 'No selection result yet',
                startRandom: 'Start Selection',
                saveResult: 'Save Result',
                shareResult: 'Share Result',
                historyRecords: 'History Records',
                viewHistory: 'View and manage your menu history records',
                selectDate: 'Select Date',
                noHistory: 'No history records',
                editDish: 'Edit Dish',
                cancel: 'Cancel',
                saveChanges: 'Save Changes',
                shareMenu: 'Share Menu',
                copyLink: 'Copy Share Link',
                success: 'Operation successful!',
                deleteConfirm: 'Are you sure you want to delete this dish?',
                exportSuccess: 'Data exported successfully',
                importSuccess: 'Data imported successfully',
                copySuccess: 'Link copied to clipboard',
                saveResultSuccess: 'Result saved successfully'
            }
        };
    }

    // 添加模拟数据
    addMockData() {
        if (this.dishes.length === 0) {
            const mockDishes = [
                new Dish(1, '宫保鸡丁', '炒菜', '中等', 4, ['辣', '家常菜']),
                new Dish(2, '鱼香肉丝', '炒菜', '中等', 5, ['甜辣', '川菜']),
                new Dish(3, '麻婆豆腐', '炒菜', '简单', 4, ['麻辣', '川菜']),
                new Dish(4, '红烧肉', '炒菜', '复杂', 5, ['油腻', '硬菜']),
                new Dish(5, '清炒时蔬', '炒菜', '简单', 3, ['清淡', '健康']),
                new Dish(6, '番茄蛋汤', '汤羹', '简单', 4, ['清淡', '开胃']),
                new Dish(7, '紫菜蛋汤', '汤羹', '简单', 3, ['清淡', '海鲜']),
                new Dish(8, '米饭', '主食', '简单', 5, ['主食']),
                new Dish(9, '面条', '主食', '简单', 4, ['主食']),
                new Dish(10, '馒头', '主食', '中等', 3, ['主食']),
                new Dish(11, '水果沙拉', '甜点', '简单', 4, ['健康', '甜点']),
                new Dish(12, '冰淇淋', '甜点', '简单', 5, ['甜点', '冷饮'])
            ];
            this.dishes = mockDishes;
            this.saveDishes();
            this.renderDishList();
        }
    }

    // 初始化事件监听器
    initEventListeners() {
        // 移动端菜单
        document.getElementById('mobileMenuBtn').addEventListener('click', () => {
            document.getElementById('mobileMenu').classList.toggle('hidden');
        });

        // 导航栏滚动效果
        window.addEventListener('scroll', this.updateNavbarScroll.bind(this));

        // 语言切换
        document.getElementById('languageToggle').addEventListener('click', this.toggleLanguage.bind(this));
        document.getElementById('mobileLanguageToggle').addEventListener('click', this.toggleLanguage.bind(this));

        // 添加菜品表单提交
        document.getElementById('addDishForm').addEventListener('submit', this.handleAddDish.bind(this));

        // 权重滑块
        document.getElementById('dishWeight').addEventListener('input', (e) => {
            document.getElementById('weightValue').textContent = e.target.value;
        });

        // 编辑菜品权重滑块
        document.getElementById('editDishWeight').addEventListener('input', (e) => {
            document.getElementById('editWeightValue').textContent = e.target.value;
        });

        // 添加首个菜品按钮
        document.getElementById('addFirstDishBtn').addEventListener('click', () => {
            document.getElementById('dishName').focus();
            document.getElementById('addDishForm').scrollIntoView({ behavior: 'smooth' });
        });

        // 搜索和筛选
        document.getElementById('searchDish').addEventListener('input', this.renderDishList.bind(this));
        document.getElementById('filterCategory').addEventListener('change', this.renderDishList.bind(this));
        document.getElementById('filterDifficulty').addEventListener('change', this.renderDishList.bind(this));

        // 导出数据
        document.getElementById('exportDataBtn').addEventListener('click', this.exportData.bind(this));

        // 导入数据
        document.getElementById('importDataBtn').addEventListener('change', this.importData.bind(this));

        // 随机抽取
        document.getElementById('randomizeBtn').addEventListener('click', this.randomizeDishes.bind(this));
        document.getElementById('startRandomBtn').addEventListener('click', this.randomizeDishes.bind(this));

        // 排除天数滑块
        document.getElementById('excludeDays').addEventListener('input', (e) => {
            document.getElementById('excludeDaysValue').textContent = e.target.value;
        });

        // 保存随机结果
        document.getElementById('saveResultBtn').addEventListener('click', this.saveRandomResult.bind(this));

        // 分享结果
        document.getElementById('shareResultBtn').addEventListener('click', this.showShareModal.bind(this));

        // 关闭分享模态框
        document.getElementById('closeShareModalBtn').addEventListener('click', this.hideShareModal.bind(this));

        // 复制分享链接
        document.getElementById('copyShareLinkBtn').addEventListener('click', this.copyShareLink.bind(this));

        // 历史记录筛选
        document.getElementById('historyDateFilter').addEventListener('change', this.renderHistoryList.bind(this));
        document.getElementById('historyCategoryFilter').addEventListener('change', this.renderHistoryList.bind(this));

        // 平滑滚动
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                document.querySelector(this.getAttribute('href')).scrollIntoView({ behavior: 'smooth' });
                document.getElementById('mobileMenu').classList.add('hidden');
            });
        });
    }

    // 更新导航栏滚动效果
    updateNavbarScroll() {
        const navbar = document.getElementById('navbar');
        if (window.scrollY > 10) {
            navbar.classList.add('py-2', 'shadow-lg');
            navbar.classList.remove('py-3', 'shadow-md');
        } else {
            navbar.classList.add('py-3', 'shadow-md');
            navbar.classList.remove('py-2', 'shadow-lg');
        }
    }

    // 切换语言
    toggleLanguage() {
        this.currentLanguage = this.currentLanguage === 'zh' ? 'en' : 'zh';
        document.querySelectorAll('#languageToggle span, #mobileLanguageToggle span').forEach(span => {
            span.textContent = this.currentLanguage === 'zh' ? '中文' : 'English';
        });
        this.renderTranslations();
    }

    // 渲染翻译
    renderTranslations() {
        const t = this.translations[this.currentLanguage];
        // 这里可以添加更多需要翻译的元素
    }

    // 处理添加菜品
    handleAddDish(e) {
        e.preventDefault();
        
        const name = document.getElementById('dishName').value.trim();
        const category = document.getElementById('dishCategory').value;
        const difficulty = document.getElementById('dishDifficulty').value;
        const weight = parseInt(document.getElementById('dishWeight').value);
        const tagsInput = document.getElementById('dishTags').value.trim();
        const tags = tagsInput ? tagsInput.split(',').map(tag => tag.trim()) : [];
        
        if (!name || !category) {
            return;
        }
        
        const id = this.dishes.length > 0 ? Math.max(...this.dishes.map(d => d.id)) + 1 : 1;
        const newDish = new Dish(id, name, category, difficulty, weight, tags);
        
        this.dishes.push(newDish);
        this.saveDishes();
        
        // 清空表单
        document.getElementById('addDishForm').reset();
        document.getElementById('weightValue').textContent = '3';
        
        this.renderDishList();
        this.showNotification('success');
    }

    // 渲染菜品列表
    renderDishList() {
        const dishList = document.getElementById('dishList');
        const emptyState = document.getElementById('emptyState');
        const searchTerm = document.getElementById('searchDish').value.toLowerCase();
        const categoryFilter = document.getElementById('filterCategory').value;
        const difficultyFilter = document.getElementById('filterDifficulty').value;
        
        // 筛选菜品
        let filteredDishes = this.dishes.filter(dish => {
            const matchesSearch = dish.name.toLowerCase().includes(searchTerm);
            const matchesCategory = !categoryFilter || dish.category === categoryFilter;
            const matchesDifficulty = !difficultyFilter || dish.difficulty === difficultyFilter;
            return matchesSearch && matchesCategory && matchesDifficulty;
        });
        
        // 显示空状态或菜品列表
        if (filteredDishes.length === 0) {
            dishList.innerHTML = '';
            emptyState.classList.remove('hidden');
        } else {
            emptyState.classList.add('hidden');
            
            // 清空列表
            dishList.innerHTML = '';
            
            // 添加菜品项
            filteredDishes.forEach(dish => {
                const dishItem = document.createElement('div');
                dishItem.className = 'bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow';
                dishItem.innerHTML = `
                    <div class="flex justify-between items-start mb-3">
                        <h4 class="font-bold text-lg">${dish.name}</h4>
                        <div class="flex space-x-1">
                            <button class="edit-dish text-secondary hover:text-secondary/80" data-id="${dish.id}">
                                <i class="fa fa-pencil"></i>
                            </button>
                            <button class="delete-dish text-red-500 hover:text-red-600" data-id="${dish.id}">
                                <i class="fa fa-trash"></i>
                            </button>
                        </div>
                    </div>
                    <div class="flex flex-wrap gap-2 mb-3">
                        <span class="px-2 py-1 bg-orange-50 text-primary text-xs rounded-full">${dish.category}</span>
                        <span class="px-2 py-1 bg-blue-50 text-secondary text-xs rounded-full">${dish.difficulty}</span>
                        <span class="px-2 py-1 bg-green-50 text-accent text-xs rounded-full">权重: ${dish.weight}</span>
                    </div>
                    ${dish.tags.length > 0 ? `
                        <div class="flex flex-wrap gap-1 mt-2">
                            ${dish.tags.map(tag => `
                                <span class="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">${tag}</span>
                            `).join('')}
                        </div>
                    ` : ''}
                `;
                
                dishList.appendChild(dishItem);
            });
            
            // 添加编辑和删除事件监听器
            document.querySelectorAll('.edit-dish').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const id = parseInt(e.currentTarget.dataset.id);
                    this.showEditModal(id);
                });
            });
            
            document.querySelectorAll('.delete-dish').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const id = parseInt(e.currentTarget.dataset.id);
                    this.deleteDish(id);
                });
            });
        }
    }

    // 显示编辑模态框
    showEditModal(id) {
        const dish = this.dishes.find(d => d.id === id);
        if (!dish) return;
        
        document.getElementById('editDishId').value = dish.id;
        document.getElementById('editDishName').value = dish.name;
        document.getElementById('editDishCategory').value = dish.category;
        document.getElementById('editDishDifficulty').value = dish.difficulty;
        document.getElementById('editDishWeight').value = dish.weight;
        document.getElementById('editWeightValue').textContent = dish.weight;
        document.getElementById('editDishTags').value = dish.tags.join(', ');
        
        const editModal = document.getElementById('editDishModal');
        editModal.classList.remove('opacity-0', 'pointer-events-none');
        editModal.querySelector('div').classList.remove('scale-95');
        editModal.querySelector('div').classList.add('scale-100');
        
        // 关闭模态框
        document.getElementById('closeEditModalBtn').addEventListener('click', this.hideEditModal.bind(this));
        document.getElementById('cancelEditBtn').addEventListener('click', this.hideEditModal.bind(this));
        
        // 保存编辑
        document.getElementById('editDishForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveDishEdit();
        }, { once: true });
        
        // 点击模态框外部关闭
        editModal.addEventListener('click', (e) => {
            if (e.target === editModal) {
                this.hideEditModal();
            }
        });
    }

    // 隐藏编辑模态框
    hideEditModal() {
        const editModal = document.getElementById('editDishModal');
        editModal.classList.add('opacity-0', 'pointer-events-none');
        editModal.querySelector('div').classList.remove('scale-100');
        editModal.querySelector('div').classList.add('scale-95');
    }

    // 保存菜品编辑
    saveDishEdit() {
        const id = parseInt(document.getElementById('editDishId').value);
        const name = document.getElementById('editDishName').value.trim();
        const category = document.getElementById('editDishCategory').value;
        const difficulty = document.getElementById('editDishDifficulty').value;
        const weight = parseInt(document.getElementById('editDishWeight').value);
        const tagsInput = document.getElementById('editDishTags').value.trim();
        const tags = tagsInput ? tagsInput.split(',').map(tag => tag.trim()) : [];
        
        if (!name || !category) {
            return;
        }
        
        const dishIndex = this.dishes.findIndex(d => d.id === id);
        if (dishIndex !== -1) {
            this.dishes[dishIndex] = new Dish(id, name, category, difficulty, weight, tags);
            this.saveDishes();
            this.renderDishList();
            this.hideEditModal();
            this.showNotification('success');
        }
    }

    // 删除菜品
    deleteDish(id) {
        if (confirm(this.translations[this.currentLanguage].deleteConfirm)) {
            this.dishes = this.dishes.filter(dish => dish.id !== id);
            this.saveDishes();
            this.renderDishList();
            this.showNotification('success');
        }
    }

    // 导出数据
    exportData() {
        const data = {
            dishes: this.dishes,
            history: this.history,
            exportDate: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `eat_everyday_data_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
        this.showNotification('exportSuccess');
    }

    // 导入数据
    importData(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target.result);
                if (data.dishes && Array.isArray(data.dishes)) {
                    this.dishes = data.dishes.map(dish => new Dish(
                        dish.id,
                        dish.name,
                        dish.category,
                        dish.difficulty,
                        dish.weight || 3,
                        dish.tags || []
                    ));
                    this.saveDishes();
                }
                if (data.history && Array.isArray(data.history)) {
                    this.history = data.history.map(record => new HistoryRecord(
                        record.id,
                        record.date,
                        record.dishes
                    ));
                    this.saveHistory();
                }
                
                this.renderDishList();
                this.renderHistoryList();
                this.showNotification('importSuccess');
            } catch (error) {
                console.error('Failed to import data:', error);
                alert('数据导入失败，请检查文件格式是否正确。');
            }
        };
        reader.readAsText(file);
        
        // 重置文件输入
        e.target.value = '';
    }

    // 随机抽取菜品
    randomizeDishes() {
        const excludeDays = parseInt(document.getElementById('excludeDays').value);
        const dishesPerMeal = parseInt(document.getElementById('dishesPerMeal').value);
        const selectedCategories = Array.from(document.querySelectorAll('input[name="selectedCategories"]:checked')).map(checkbox => checkbox.value);
        
        // 获取排除的菜品ID
        const excludedDishIds = this.getExcludedDishIds(excludeDays);
        
        // 筛选可抽取的菜品
        let availableDishes = this.dishes.filter(dish => 
            selectedCategories.includes(dish.category) && 
            !excludedDishIds.includes(dish.id)
        );
        
        if (availableDishes.length === 0) {
            // 如果没有可用菜品，不考虑排除规则
            availableDishes = this.dishes.filter(dish => selectedCategories.includes(dish.category));
        }
        
        if (availableDishes.length === 0) {
            alert('没有可抽取的菜品，请先添加菜品。');
            return;
        }
        
        // 显示动画
        document.getElementById('randomEmptyState').classList.add('hidden');
        document.getElementById('randomResult').classList.add('hidden');
        document.getElementById('resultActions').classList.add('hidden');
        document.getElementById('drawingAnimation').classList.remove('hidden');
        
        // 延迟显示结果，模拟抽取过程
        setTimeout(() => {
            // 使用权重进行随机抽取
            const selectedDishes = this.weightedRandomSelection(availableDishes, dishesPerMeal);
            this.currentRandomResult = selectedDishes;
            
            // 隐藏动画，显示结果
            document.getElementById('drawingAnimation').classList.add('hidden');
            document.getElementById('randomResult').classList.remove('hidden');
            document.getElementById('resultActions').classList.remove('hidden');
            
            // 渲染随机结果
            this.renderRandomResult(selectedDishes);
        }, 1500);
    }

    // 获取排除的菜品ID
    getExcludedDishIds(days) {
        if (days <= 0) return [];
        
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        
        const excludedIds = new Set();
        
        this.history.forEach(record => {
            const recordDate = new Date(record.date);
            if (recordDate >= cutoffDate) {
                record.dishes.forEach(dish => {
                    excludedIds.add(dish.id);
                });
            }
        });
        
        return Array.from(excludedIds);
    }

    // 加权随机选择
    weightedRandomSelection(items, count) {
        // 创建权重数组
        const weights = items.map(item => item.weight);
        
        // 计算总权重
        const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
        
        const selectedItems = [];
        const availableItems = [...items];
        const availableWeights = [...weights];
        
        // 选择指定数量的项目
        const selectionCount = Math.min(count, availableItems.length);
        
        for (let i = 0; i < selectionCount; i++) {
            // 计算当前总权重
            const currentTotalWeight = availableWeights.reduce((sum, weight) => sum + weight, 0);
            
            // 生成随机数
            let random = Math.random() * currentTotalWeight;
            
            // 根据权重选择项目
            let selectedIndex = 0;
            for (let j = 0; j < availableWeights.length; j++) {
                random -= availableWeights[j];
                if (random <= 0) {
                    selectedIndex = j;
                    break;
                }
            }
            
            // 添加选中的项目
            selectedItems.push(availableItems[selectedIndex]);
            
            // 从可用列表中移除选中的项目
            availableItems.splice(selectedIndex, 1);
            availableWeights.splice(selectedIndex, 1);
        }
        
        return selectedItems;
    }

    // 渲染随机结果
    renderRandomResult(dishes) {
        const resultContainer = document.getElementById('randomResult');
        resultContainer.innerHTML = '';
        
        dishes.forEach((dish, index) => {
            // 添加动画延迟
            const delay = index * 0.2;
            
            const dishCard = document.createElement('div');
            dishCard.className = 'bg-white border border-gray-200 rounded-xl p-5 shadow-md transform translate-y-4 opacity-0 transition-all';
            dishCard.style.transitionDelay = `${delay}s`;
            
            setTimeout(() => {
                dishCard.classList.remove('translate-y-4', 'opacity-0');
            }, 50);
            
            dishCard.innerHTML = `
                <div class="text-center">
                    <div class="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-3">
                        <i class="fa fa-cutlery text-primary text-xl"></i>
                    </div>
                    <h4 class="font-bold text-lg mb-1">${dish.name}</h4>
                    <span class="inline-block px-2 py-1 bg-orange-50 text-primary text-xs rounded-full mb-2">${dish.category}</span>
                    <div class="flex justify-center items-center space-x-2 text-sm text-gray-500">
                        <span>${dish.difficulty}</span>
                        <span>•</span>
                        <span>权重: ${dish.weight}</span>
                    </div>
                </div>
            `;
            
            resultContainer.appendChild(dishCard);
        });
    }

    // 保存随机结果
    saveRandomResult() {
        if (!this.currentRandomResult || this.currentRandomResult.length === 0) return;
        
        const id = this.history.length > 0 ? Math.max(...this.history.map(h => h.id)) + 1 : 1;
        const date = new Date().toISOString().split('T')[0];
        
        const newRecord = new HistoryRecord(id, date, this.currentRandomResult);
        this.history.push(newRecord);
        this.saveHistory();
        
        this.renderHistoryList();
        this.showNotification('saveResultSuccess');
    }

    // 显示分享模态框
    showShareModal() {
        if (!this.currentRandomResult || this.currentRandomResult.length === 0) return;
        
        const shareContent = document.getElementById('shareContent');
        shareContent.innerHTML = `
            <h4 class="font-bold text-center mb-3">今日菜单推荐</h4>
            <div class="space-y-2">
                ${this.currentRandomResult.map(dish => `
                    <div class="flex items-center space-x-2 p-2 bg-white rounded-lg">
                        <i class="fa fa-cutlery text-primary"></i>
                        <span>${dish.name}</span>
                        <span class="ml-auto text-xs px-2 py-0.5 bg-orange-50 text-primary rounded-full">${dish.category}</span>
                    </div>
                `).join('')}
            </div>
            <div class="text-center text-sm text-gray-500 mt-3">
                由 Eat Everyday 推荐
            </div>
        `;
        
        const shareModal = document.getElementById('shareModal');
        shareModal.classList.remove('opacity-0', 'pointer-events-none');
        shareModal.querySelector('div').classList.remove('scale-95');
        shareModal.querySelector('div').classList.add('scale-100');
        
        // 关闭模态框
        document.getElementById('closeShareModalBtn').addEventListener('click', this.hideShareModal.bind(this));
        
        // 点击模态框外部关闭
        shareModal.addEventListener('click', (e) => {
            if (e.target === shareModal) {
                this.hideShareModal();
            }
        });
    }

    // 隐藏分享模态框
    hideShareModal() {
        const shareModal = document.getElementById('shareModal');
        shareModal.classList.add('opacity-0', 'pointer-events-none');
        shareModal.querySelector('div').classList.remove('scale-100');
        shareModal.querySelector('div').classList.add('scale-95');
    }

    // 复制分享链接
    copyShareLink() {
        // 这里简化实现，实际项目中可以生成带参数的分享链接
        const shareText = `今日菜单推荐：\n${this.currentRandomResult.map(dish => `- ${dish.name} (${dish.category})`).join('\n')}\n\n由 Eat Everyday 推荐`;
        
        navigator.clipboard.writeText(shareText).then(() => {
            this.showNotification('copySuccess');
        }).catch(err => {
            console.error('Failed to copy:', err);
        });
    }

    // 渲染历史记录
    renderHistoryList() {
        const historyList = document.getElementById('historyList');
        const historyEmptyState = document.getElementById('historyEmptyState');
        const dateFilter = document.getElementById('historyDateFilter').value;
        const categoryFilter = document.getElementById('historyCategoryFilter').value;
        
        // 筛选历史记录
        let filteredHistory = [...this.history];
        
        if (dateFilter) {
            filteredHistory = filteredHistory.filter(record => record.date === dateFilter);
        }
        
        if (categoryFilter) {
            filteredHistory = filteredHistory.filter(record => 
                record.dishes.some(dish => dish.category === categoryFilter)
            );
        }
        
        // 按日期排序（最新的在前）
        filteredHistory.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        // 显示空状态或历史记录
        if (filteredHistory.length === 0) {
            historyList.innerHTML = '';
            historyEmptyState.classList.remove('hidden');
        } else {
            historyEmptyState.classList.add('hidden');
            
            // 清空列表
            historyList.innerHTML = '';
            
            // 添加历史记录项
            filteredHistory.forEach(record => {
                const historyItem = document.createElement('div');
                historyItem.className = 'bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow';
                historyItem.innerHTML = `
                    <div class="flex justify-between items-center mb-3">
                        <h4 class="font-bold text-lg">${this.formatDate(record.date)}</h4>
                        <span class="px-2 py-1 bg-gray-100 text-gray-600 text-sm rounded-full">${record.dishes.length} 道菜品</span>
                    </div>
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        ${record.dishes.map(dish => `
                            <div class="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg">
                                <i class="fa fa-cutlery text-primary"></i>
                                <span>${dish.name}</span>
                                <span class="ml-auto text-xs px-2 py-0.5 bg-orange-50 text-primary rounded-full">${dish.category}</span>
                            </div>
                        `).join('')}
                    </div>
                `;
                
                historyList.appendChild(historyItem);
            });
        }
    }

    // 格式化日期
    formatDate(dateString) {
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    // 显示通知
    showNotification(type) {
        const notification = document.getElementById('notification');
        const notificationText = document.getElementById('notificationText');
        const notificationIcon = document.getElementById('notificationIcon');
        
        // 设置通知内容和图标
        const t = this.translations[this.currentLanguage];
        notificationText.textContent = t[type] || t.success;
        
        if (type === 'success' || type === 'exportSuccess' || type === 'importSuccess' || type === 'copySuccess' || type === 'saveResultSuccess') {
            notificationIcon.className = 'fa fa-check-circle text-accent';
        } else {
            notificationIcon.className = 'fa fa-exclamation-circle text-yellow-500';
        }
        
        // 显示通知
        notification.classList.remove('translate-y-20', 'opacity-0');
        
        // 3秒后隐藏通知
        setTimeout(() => {
            notification.classList.add('translate-y-20', 'opacity-0');
        }, 3000);
    }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    const app = new EatEverydayApp();
});