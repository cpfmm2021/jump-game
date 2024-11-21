class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // 캔버스 크기 설정
        this.canvas.width = 640;
        this.canvas.height = 320;

        // 게임 상태
        this.gameOver = false;
        this.isPaused = false;
        this.score = 0;
        this.level = 1;
        this.currentStage = 1;
        this.onStageClear = null;
        this.targetScore = 100;
        this.gameLoop = null;
        this.levelDistance = 5000;
        this.distance = 0;
        
        // 플레이어 초기화
        this.player = {
            x: 40,
            y: this.canvas.height - 40,
            width: 30,
            height: 30,
            velocityY: 0,
            isJumping: false,
            jumpCount: 0,
            maxJumps: 3
        };

        // 장애물 초기화
        this.obstacles = [];
        this.obstacleSpeed = 5;
        this.obstacleTimer = 0;
        this.obstacleInterval = 60;

        // 코인 초기화
        this.coins = [];
        this.coinTimer = 0;
        this.coinInterval = 45;

        // 사운드 초기화
        this.sounds = {
            jump: new Audio('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3'),
            coin: new Audio('https://assets.mixkit.co/active_storage/sfx/2578/2578-preview.mp3'),
            collision: new Audio('https://assets.mixkit.co/active_storage/sfx/2620/2620-preview.mp3'),
            levelComplete: new Audio('https://assets.mixkit.co/active_storage/sfx/2578/2578-preview.mp3')
        };

        // 배경음악 설정
        this.bgm = document.getElementById('bgm');
        this.bgm.src = 'https://assets.mixkit.co/music/preview/mixkit-game-show-fun-642.mp3';
        this.bgm.volume = 0.5; // 볼륨을 50%로 설정
        this.bgmButton = document.getElementById('bgmButton');
        this.isMuted = false;

        // BGM 버튼 이벤트
        this.bgmButton.addEventListener('click', () => {
            if (this.isMuted) {
                this.bgm.play();
                this.bgmButton.textContent = '';
                this.bgmButton.classList.remove('muted');
            } else {
                this.bgm.pause();
                this.bgmButton.textContent = '';
                this.bgmButton.classList.add('muted');
            }
            this.isMuted = !this.isMuted;
        });

        // 이벤트 리스너 설정
        this.setupEventListeners();

        // 시작 버튼 이벤트 리스너
        document.getElementById('startButton').addEventListener('click', () => {
            document.getElementById('startButton').style.display = 'none';
            this.startGame();
        });
    }

    setupEventListeners() {
        // 키보드 이벤트
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' || e.key === ' ') {
                e.preventDefault();
                this.jump();
            } else if (e.code === 'Escape') {
                this.togglePause();
            }
        });

        // 시작 버튼
        const startButton = document.getElementById('startButton');
        if (startButton) {
            startButton.addEventListener('click', () => this.startGame());
        }

        // 일시정지 버튼
        const pauseButton = document.getElementById('pauseButton');
        if (pauseButton) {
            pauseButton.addEventListener('click', () => this.togglePause());
        }

        // 모달 버튼들
        document.getElementById('resumeButton').addEventListener('click', () => this.resumeGame());
        document.getElementById('quitButton').addEventListener('click', () => this.quitGame());
        document.getElementById('nextLevelButton').addEventListener('click', () => this.startNextLevel());
        document.getElementById('restartButton').addEventListener('click', () => this.restartGame());
        
        // 모바일 점프 버튼
        const leftJumpButton = document.getElementById('leftJumpButton');
        const rightJumpButton = document.getElementById('rightJumpButton');
        
        if (leftJumpButton) {
            leftJumpButton.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.jump();
            });
        }
        
        if (rightJumpButton) {
            rightJumpButton.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.jump();
            });
        }
    }

    jump() {
        if (!this.gameOver && !this.isPaused && this.player.jumpCount < this.player.maxJumps) {
            this.player.isJumping = true;
            this.player.jumpCount++;
            
            // 점프 높이를 점프 횟수에 따라 다르게 설정
            if (this.player.jumpCount === 1) {
                this.player.velocityY = -10;    // 100%
            } else if (this.player.jumpCount === 2) {
                this.player.velocityY = -9;     // 90%
            } else if (this.player.jumpCount === 3) {
                this.player.velocityY = -8;     // 80%
            }
            
            this.sounds.jump.currentTime = 0;
            this.sounds.jump.play();
        }
    }

    togglePause() {
        if (this.gameOver) return;
        
        this.isPaused = !this.isPaused;
        const pauseModal = document.getElementById('pauseModal');
        const pauseButton = document.getElementById('pauseButton');
        
        if (this.isPaused) {
            pauseModal.classList.remove('hidden');
            if (this.gameLoop) {
                cancelAnimationFrame(this.gameLoop);
                this.gameLoop = null;
            }
            this.bgm.pause();
        } else {
            pauseModal.classList.add('hidden');
            this.gameLoop = requestAnimationFrame(() => this.gameStep());
            if (!this.isMuted) {
                this.bgm.play();
            }
        }
        
        pauseButton.textContent = this.isPaused ? '계속하기' : '일시정지';
    }

    update() {
        if (this.gameOver || this.isPaused) return;

        // 플레이어 업데이트
        this.player.velocityY += 0.5; // 중력 조정
        this.player.y += this.player.velocityY;

        // 바닥 충돌 체크
        if (this.player.y > this.canvas.height - this.player.height) {
            this.player.y = this.canvas.height - this.player.height;
            this.player.velocityY = 0;
            this.player.isJumping = false;
            this.player.jumpCount = 0;
        }

        // 거리 업데이트
        this.distance += this.obstacleSpeed;
        
        // 진행률 업데이트
        const progress = (this.distance / this.levelDistance) * 100;
        document.getElementById('progressBar').style.width = `${progress}%`;
        document.getElementById('playerPosition').style.left = `${progress}%`;

        // 레벨 완료 체크
        if (this.distance >= this.levelDistance) {
            this.levelComplete();
            return;
        }

        // 코인 생성
        if (Math.random() < 0.02) {
            const isSpecial = Math.random() < 0.1; // 10% 확률로 특수 코인
            const maxJumpHeight = this.canvas.height - 160; // 플레이어가 도달할 수 있는 최대 높이
            this.coins.push({
                x: this.canvas.width,
                y: Math.random() * (this.canvas.height - maxJumpHeight) + maxJumpHeight,
                width: 20,
                height: 20,
                isSpecial: isSpecial
            });
        }

        // 장애물 생성 (더 낮은 빈도)
        if (Math.random() < 0.005) {
            this.obstacles.push({
                x: this.canvas.width,
                y: this.canvas.height - 30,
                width: 30,
                height: Math.random() * 60 + 30 // 더 낮은 높이
            });
        }

        // 코인 업데이트
        for (let i = this.coins.length - 1; i >= 0; i--) {
            const coin = this.coins[i];
            coin.x -= this.obstacleSpeed;

            // 코인 충돌 체크
            if (this.checkCollision(this.player, coin)) {
                this.coins.splice(i, 1);
                this.updateScore(coin.isSpecial ? 50 : 10);
                continue;
            }

            // 화면 밖으로 나간 코인 제거
            if (coin.x + coin.width < 0) {
                this.coins.splice(i, 1);
            }
        }

        // 장애물 업데이트
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const obstacle = this.obstacles[i];
            obstacle.x -= this.obstacleSpeed;

            // 장애물 충돌 체크
            if (this.checkCollision(this.player, obstacle)) {
                this.sounds.collision.play();
                this.gameOver = true;
                this.endGame();
                return;
            }

            // 화면 밖으로 나간 장애물 제거
            if (obstacle.x + obstacle.width < 0) {
                this.obstacles.splice(i, 1);
            }
        }
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // 배경 그리기
        this.ctx.fillStyle = '#87CEEB';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // 땅 그리기
        this.ctx.fillStyle = '#8B4513';
        this.ctx.fillRect(0, this.canvas.height - 20, this.canvas.width, 20);

        // 플레이어 그리기
        this.ctx.fillStyle = '#00f';
        this.ctx.fillRect(
            this.player.x,
            this.player.y,
            this.player.width,
            this.player.height
        );

        // 코인 그리기
        this.coins.forEach(coin => {
            // 코인 원 그리기
            this.ctx.fillStyle = coin.isSpecial ? '#FFD700' : '#FFA500';
            this.ctx.beginPath();
            this.ctx.arc(
                coin.x + coin.width/2,
                coin.y + coin.height/2,
                coin.width/2,
                0,
                Math.PI * 2
            );
            this.ctx.fill();

            // 코인 점수 텍스트 그리기
            this.ctx.fillStyle = '#000';
            this.ctx.font = '10px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(
                coin.isSpecial ? '50' : '10',
                coin.x + coin.width/2,
                coin.y + coin.height/2
            );
        });

        // 장애물 그리기
        this.ctx.fillStyle = '#FF4444';
        this.obstacles.forEach(obstacle => {
            this.ctx.fillRect(
                obstacle.x,
                obstacle.y,
                obstacle.width,
                obstacle.height
            );
        });
    }

    checkCollision(a, b) {
        return a.x < b.x + b.width &&
               a.x + a.width > b.x &&
               a.y < b.y + b.height &&
               a.y + a.height > b.y;
    }

    gameStep() {
        this.update();
        this.draw();
        if (!this.gameOver && !this.isPaused) {
            this.gameLoop = requestAnimationFrame(() => this.gameStep());
        }
    }

    startGame() {
        // 게임 상태 초기화
        this.gameOver = false;
        this.isPaused = false;
        this.score = 0;
        this.distance = 0;
        this.obstacles = [];
        this.coins = [];
        this.player.y = this.canvas.height - this.player.height;
        this.player.velocityY = 0;
        this.player.isJumping = false;
        this.player.jumpCount = 0;
        this.player.hasShield = false;
        
        // UI 업데이트
        document.getElementById('score').textContent = '점수: 0';
        document.getElementById('level').textContent = `Level ${this.level}`;
        document.getElementById('startButton').classList.add('hidden');
        document.getElementById('pauseButton').classList.remove('hidden');
        document.getElementById('progressBar').style.width = '0%';
        document.getElementById('playerPosition').style.left = '0%';

        // 게임 루프 시작
        if (this.gameLoop) {
            cancelAnimationFrame(this.gameLoop);
        }
        this.gameLoop = requestAnimationFrame(() => this.gameStep());
        this.bgm.play().catch(error => {
            console.log("Audio autoplay failed:", error);
        });
    }

    levelComplete() {
        this.sounds.levelComplete.play();
        if (this.gameLoop) {
            cancelAnimationFrame(this.gameLoop);
        }

        // 스테이지 클리어 처리
        if (this.onStageClear) {
            this.onStageClear();
        }

        // 홈 화면으로 돌아가기
        setTimeout(() => {
            document.getElementById('gameScreen').classList.add('hidden');
            document.getElementById('homeScreen').classList.remove('hidden');
            // 홈 스크린 새로고침
            window.homeScreen.loadClearedStage();
            window.homeScreen.stagesContainer.innerHTML = '';
            window.homeScreen.createStageButtons();
        }, 1500);
    }

    startNextLevel() {
        this.level++;
        this.levelDistance += 1000; // 다음 레벨은 더 긴 거리
        this.obstacleSpeed += 0.5; // 속도 약간 증가
        document.getElementById('levelCompleteModal').classList.add('hidden');
        this.startGame();
    }

    restartGame() {
        this.level = 1;
        this.levelDistance = 5000;
        this.obstacleSpeed = 3;
        document.getElementById('levelCompleteModal').classList.add('hidden');
        this.startGame();
    }

    resumeGame() {
        this.togglePause();
    }

    quitGame() {
        this.gameOver = true;
        this.isPaused = false;
        document.getElementById('pauseModal').classList.add('hidden');
        document.getElementById('startButton').classList.remove('hidden');
        document.getElementById('pauseButton').classList.add('hidden');
        if (this.gameLoop) {
            cancelAnimationFrame(this.gameLoop);
            this.gameLoop = null;
        }
        this.bgm.pause();
    }

    endGame() {
        this.gameOver = true;
        document.getElementById('startButton').classList.remove('hidden');
        document.getElementById('pauseButton').classList.add('hidden');
        document.getElementById('startButton').textContent = '다시 시작';
        if (this.gameLoop) {
            cancelAnimationFrame(this.gameLoop);
            this.gameLoop = null;
        }
        this.bgm.pause();
    }

    updateScore(points) {
        this.score += points;
        document.getElementById('score').textContent = `점수: ${this.score}`;
        
        // 목표 점수 달성시 스테이지 클리어
        if (this.score >= this.targetScore) {
            this.levelComplete();
        }
    }
}

// 게임 인스턴스 생성
window.onload = () => {
    new Game();
};
