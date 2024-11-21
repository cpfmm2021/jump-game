class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.gameOver = false;
        this.score = 0;
        
        // 플레이어 초기화
        this.player = {
            x: 50,
            y: this.canvas.height - 50,
            width: 40,
            height: 40,
            velocityY: 0,
            isJumping: false,
            jumpCount: 0,
            maxJumps: 3,
            frame: 0,
            frameCount: 8,
            animationSpeed: 0.2,
            hasShield: false
        };

        // 게임 요소 초기화
        this.obstacles = [];
        this.powerups = [];
        this.gameTime = 0;
        this.difficultyLevel = 1;
        this.obstacleSpeed = 5;

        // 사운드 초기화
        this.sounds = {
            jump: new Audio('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3'),
            collision: new Audio('https://assets.mixkit.co/active_storage/sfx/2620/2620-preview.mp3'),
            powerup: new Audio('https://assets.mixkit.co/active_storage/sfx/2578/2578-preview.mp3')
        };

        // 이벤트 리스너 설정
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
        
        // 모바일 점프 버튼 이벤트 리스너
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
        if (this.player.jumpCount < this.player.maxJumps) {
            // 각 점프 단계별로 다른 점프력과 효과 적용
            switch(this.player.jumpCount) {
                case 0: // 첫 번째 점프
                    this.player.velocityY = -15;
                    break;
                case 1: // 두 번째 점프
                    this.player.velocityY = -13;
                    break;
                case 2: // 세 번째 점프
                    this.player.velocityY = -11;
                    break;
            }
            
            this.player.isJumping = true;
            this.player.jumpCount++;
            
            // 점프 효과음 재생 (점프 단계별로 다른 피치)
            this.sounds.jump.playbackRate = 1 + (this.player.jumpCount * 0.1);
            this.sounds.jump.currentTime = 0;
            this.sounds.jump.play();
        }
    }

    handleKeyDown(event) {
        if (event.code === 'Space' || event.key === ' ') {
            event.preventDefault();
            this.jump();
        }
    }

    update() {
        if (!this.gameOver) {
            this.gameTime++;
            
            // 난이도 증가
            if (this.gameTime % 1000 === 0) {
                this.difficultyLevel++;
                this.obstacleSpeed += 0.5;
            }

            // 플레이어 업데이트
            this.player.velocityY += 0.8;
            this.player.y += this.player.velocityY;
            this.player.frame = (this.player.frame + this.player.animationSpeed) % this.player.frameCount;

            if (this.player.y > this.canvas.height - this.player.height) {
                this.player.y = this.canvas.height - this.player.height;
                this.player.velocityY = 0;
                this.player.isJumping = false;
                this.player.jumpCount = 0; // 땅에 닿으면 점프 카운트 초기화
            }

            // 파워업 생성
            if (Math.random() < 0.002) {
                this.powerups.push({
                    x: this.canvas.width,
                    y: Math.random() * (this.canvas.height - 100),
                    width: 20,
                    height: 20,
                    type: 'shield'
                });
            }

            // 파워업 업데이트
            for (let i = this.powerups.length - 1; i >= 0; i--) {
                const powerup = this.powerups[i];
                powerup.x -= this.obstacleSpeed * 0.7;

                // 파워업 충돌 체크
                if (this.checkCollision(this.player, powerup)) {
                    if (powerup.type === 'shield') {
                        this.player.hasShield = true;
                        setTimeout(() => { this.player.hasShield = false; }, 5000);
                        this.sounds.powerup.play();
                    }
                    this.powerups.splice(i, 1);
                }

                if (powerup.x + powerup.width < 0) {
                    this.powerups.splice(i, 1);
                }
            }

            // 장애물 생성
            if (Math.random() < 0.02) {
                const obstacleTypes = [
                    { width: 20, height: 30, speed: this.obstacleSpeed },
                    { width: 30, height: 40, speed: this.obstacleSpeed * 1.2 },
                    { width: 15, height: 50, speed: this.obstacleSpeed * 0.8 }
                ];
                
                const type = obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)];
                
                this.obstacles.push({
                    x: this.canvas.width,
                    y: this.canvas.height - type.height,
                    width: type.width,
                    height: type.height,
                    speed: type.speed
                });
            }

            // 장애물 업데이트
            for (let i = this.obstacles.length - 1; i >= 0; i--) {
                const obstacle = this.obstacles[i];
                obstacle.x -= obstacle.speed;

                if (this.checkCollision(this.player, obstacle)) {
                    if (this.player.hasShield) {
                        this.obstacles.splice(i, 1);
                        continue;
                    }
                    this.sounds.collision.play();
                    this.gameOver = true;
                    this.endGame();
                }

                if (obstacle.x + obstacle.width < 0) {
                    this.obstacles.splice(i, 1);
                    this.score++;
                    document.getElementById('score').textContent = `점수: ${this.score}`;
                }
            }
        }
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // 배경 그리기
        this.ctx.fillStyle = '#87CEEB';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // 구름 그리기
        this.ctx.fillStyle = '#fff';
        this.ctx.beginPath();
        this.ctx.arc(100, 50, 20, 0, Math.PI * 2);
        this.ctx.arc(130, 50, 20, 0, Math.PI * 2);
        this.ctx.arc(115, 40, 20, 0, Math.PI * 2);
        this.ctx.fill();

        // 땅 그리기
        this.ctx.fillStyle = '#8B4513';
        this.ctx.fillRect(0, this.canvas.height - 20, this.canvas.width, 20);

        // 플레이어 그리기
        this.ctx.save();
        if (this.player.hasShield) {
            this.ctx.shadowColor = '#00f';
            this.ctx.shadowBlur = 20;
        }

        // 점프 단계에 따른 플레이어 색상 변화
        switch(this.player.jumpCount) {
            case 0:
                this.ctx.fillStyle = '#00f'; // 기본 파란색
                break;
            case 1:
                this.ctx.fillStyle = '#4169E1'; // 로얄 블루
                break;
            case 2:
                this.ctx.fillStyle = '#1E90FF'; // 밝은 파란색
                break;
        }

        this.ctx.fillRect(
            this.player.x,
            this.player.y,
            this.player.width,
            this.player.height
        );

        // 플레이어 눈과 입 그리기
        this.ctx.fillStyle = '#fff';
        this.ctx.fillRect(
            this.player.x + this.player.width * 0.6,
            this.player.y + this.player.height * 0.3,
            5, 5
        );
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(
            this.player.x + this.player.width * 0.4,
            this.player.y + this.player.height * 0.6,
            15, 3
        );
        this.ctx.restore();

        // 파워업 그리기
        this.powerups.forEach(powerup => {
            this.ctx.fillStyle = '#ff0';
            this.ctx.beginPath();
            this.ctx.arc(
                powerup.x + powerup.width / 2,
                powerup.y + powerup.height / 2,
                powerup.width / 2,
                0,
                Math.PI * 2
            );
            this.ctx.fill();
        });

        // 장애물 그리기
        this.obstacles.forEach(obstacle => {
            this.ctx.fillStyle = `hsl(${obstacle.height * 5}, 70%, 50%)`;
            this.ctx.fillRect(
                obstacle.x,
                obstacle.y,
                obstacle.width,
                obstacle.height
            );
        });

        // 점프 카운트 표시 (시각적 개선)
        this.ctx.fillStyle = '#000';
        this.ctx.font = '16px Arial';
        this.ctx.textAlign = 'right';
        let jumpText = '점프: ';
        for(let i = 0; i < this.player.maxJumps; i++) {
            jumpText += i < this.player.jumpCount ? '○' : '●';
        }
        this.ctx.fillText(jumpText, this.canvas.width - 10, 30);

        // 게임 오버 화면
        if (this.gameOver) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '48px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('게임 오버!', this.canvas.width / 2, this.canvas.height / 2 - 50);
            
            this.ctx.font = '24px Arial';
            this.ctx.fillText(`최종 점수: ${this.score}`, this.canvas.width / 2, this.canvas.height / 2 + 10);
            this.ctx.fillText('스페이스바를 눌러 다시 시작', this.canvas.width / 2, this.canvas.height / 2 + 50);
        }

        // 난이도 표시
        this.ctx.fillStyle = '#000';
        this.ctx.font = '20px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`난이도: ${this.difficultyLevel}`, 10, 30);
    }

    checkCollision(player, object) {
        return player.x < object.x + object.width &&
               player.x + player.width > object.x &&
               player.y < object.y + object.height &&
               player.y + player.height > object.y;
    }

    gameStep() {
        if (!this.gameOver) {
            this.update();
            this.draw();
            requestAnimationFrame(() => this.gameStep());
        }
    }

    startGame() {
        this.gameOver = false;
        this.score = 0;
        this.obstacles = [];
        this.powerups = [];
        this.player.y = this.canvas.height - this.player.height;
        this.player.velocityY = 0;
        this.player.isJumping = false;
        this.player.jumpCount = 0;
        this.player.hasShield = false;
        this.gameTime = 0;
        this.difficultyLevel = 1;
        this.obstacleSpeed = 5;
        document.getElementById('score').textContent = '점수: 0';
        document.getElementById('startButton').style.display = 'none';
        this.gameStep();
    }

    endGame() {
        this.gameOver = true;
        document.getElementById('startButton').style.display = 'block';
        document.getElementById('startButton').textContent = '다시 시작';
    }
}

// 게임 인스턴스 생성
window.onload = () => {
    const canvas = document.getElementById('gameCanvas');
    canvas.width = 800;
    canvas.height = 400;
    new Game(canvas);
};
