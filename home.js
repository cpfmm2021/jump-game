class HomeScreen {
    constructor() {
        this.stagesContainer = document.querySelector('.stages-container');
        this.gameScreen = document.getElementById('gameScreen');
        this.homeScreen = document.getElementById('homeScreen');
        this.totalStages = 6; // 총 스테이지 수
        this.currentClearedStage = 0; // 현재 클리어한 스테이지

        // 로컬 스토리지에서 클리어한 스테이지 정보 불러오기
        this.loadClearedStage();
        
        // 스테이지 버튼 생성
        this.createStageButtons();
    }

    loadClearedStage() {
        const cleared = localStorage.getItem('clearedStage');
        this.currentClearedStage = cleared ? parseInt(cleared) : 0;
    }

    saveClearedStage() {
        localStorage.setItem('clearedStage', this.currentClearedStage.toString());
    }

    createStageButtons() {
        for (let i = 1; i <= this.totalStages; i++) {
            const button = document.createElement('button');
            button.className = 'stage-button';
            if (i > this.currentClearedStage + 1) {
                button.classList.add('locked');
            }
            if (i <= this.currentClearedStage) {
                button.classList.add('cleared');
            }
            button.textContent = `Stage ${i}`;
            
            button.addEventListener('click', () => this.handleStageClick(i));
            this.stagesContainer.appendChild(button);
        }
    }

    handleStageClick(stageNum) {
        // 잠긴 스테이지는 클릭 불가
        if (stageNum > this.currentClearedStage + 1) {
            return;
        }

        // 게임 화면으로 전환
        this.homeScreen.classList.add('hidden');
        this.gameScreen.classList.remove('hidden');

        // 게임 인스턴스 생성 및 스테이지 설정
        window.game = new Game();
        window.game.currentStage = stageNum;
        window.game.onStageClear = () => {
            if (stageNum > this.currentClearedStage) {
                this.currentClearedStage = stageNum;
                this.saveClearedStage();
            }
        };
    }
}

// 홈 스크린 인스턴스 생성
window.onload = () => {
    window.homeScreen = new HomeScreen();
};
