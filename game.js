class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = 800;
        this.canvas.height = 400;
        
        this.player = {
            x: 50,
            y: this.canvas.height - 50,
            width: 40,
            height: 40,
            velocityY: 0,
            isJumping: false
        };
        
        this.obstacles = [];
        this.score = 0;
        this.gameOver = false;
        this.gameLoop = null;
        this.obstacleSpeed = 5;
        this.gameTime = 0;
        this.difficultyLevel = 1;
        this.playerSprites = {
            standing: { x: 0, y: 0 },
            jumping: { x: 1, y: 0 }
        };
        this.currentSprite = 'standing';
        
        // 이벤트 리스너 설정
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.getElementById('startButton').addEventListener('click', () => this.startGame());
    }

    handleKeyDown(event) {
        if ((event.code === 'Space' || event.key === ' ') && !this.player.isJumping) {
            this.player.velocityY = -15;
            this.player.isJumping = true;
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

            // 스프라이트 업데이트
            this.currentSprite = this.player.isJumping ? 'jumping' : 'standing';

            if (this.player.y > this.canvas.height - this.player.height) {
                this.player.y = this.canvas.height - this.player.height;
                this.player.velocityY = 0;
                this.player.isJumping = false;
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
        }

        // 난이도 표시
        this.ctx.fillStyle = '#000';
        this.ctx.font = '20px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`난이도: ${this.difficultyLevel}`, 10, 30);
    }

    checkCollision(player, obstacle) {
        return player.x < obstacle.x + obstacle.width &&
               player.x + player.width > obstacle.x &&
               player.y < obstacle.y + obstacle.height &&
               player.y + player.height > obstacle.y;
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
        this.player.y = this.canvas.height - this.player.height;
        this.player.velocityY = 0;
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
    new Game();
};
