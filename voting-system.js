// ── VOTING SYSTEM (REAL-TIME SYNC) ──
const VOTE_LIMIT = 2;
const ACCOMMODATION_OPTIONS = ['airbnb-1', 'airbnb-2', 'airbnb-3', 'resort-1', 'resort-2', 'resort-3'];

// 使用 GitHub Gist 作為簡單的雲端存儲
const GITHUB_GIST_ID = 'pattaya_votes_2026'; // 我們會建立一個 Gist
let globalVotes = {};

// 從本機存儲初始化投票
function initializeVotes() {
  globalVotes = {};
  ACCOMMODATION_OPTIONS.forEach(option => {
    globalVotes[option] = 0;
  });
  
  // 嘗試從 localStorage 恢復之前的投票
  const savedVotes = localStorage.getItem('pattaya_votes_global');
  if (savedVotes) {
    globalVotes = JSON.parse(savedVotes);
  }
}

// 更新投票顯示
function updateVoteDisplay() {
  const userVotes = JSON.parse(localStorage.getItem('pattaya_user_votes')) || [];
  
  ACCOMMODATION_OPTIONS.forEach(option => {
    const count = globalVotes[option] || 0;
    const countElement = document.getElementById(`count-${option}`);
    if (countElement) {
      countElement.textContent = `${count} 票`;
    }
    
    const btn = document.getElementById(`vote-${option}`);
    if (btn && userVotes.includes(option)) {
      btn.classList.add('voted');
      btn.textContent = '✓ 已投票';
      btn.disabled = true;
    }
  });
  
  updateVoteStatus(userVotes);
}

function updateVoteStatus(userVotes) {
  const remaining = VOTE_LIMIT - userVotes.length;
  ACCOMMODATION_OPTIONS.forEach(option => {
    const status = document.getElementById(`status-${option}`);
    if (status) {
      if (remaining > 0) {
        status.textContent = `還剩 ${remaining} 票`;
      } else {
        status.textContent = '已投滿';
      }
    }
  });
}

function voteAccommodation(option) {
  const userVotes = JSON.parse(localStorage.getItem('pattaya_user_votes')) || [];
  
  if (userVotes.length >= VOTE_LIMIT) {
    alert(`您已經投了 ${VOTE_LIMIT} 票，不能再投票了！`);
    return;
  }
  
  if (userVotes.includes(option)) {
    alert('您已經為此選項投票了！');
    return;
  }
  
  // 記錄本機投票
  userVotes.push(option);
  localStorage.setItem('pattaya_user_votes', JSON.stringify(userVotes));
  
  // 更新全域投票數
  globalVotes[option] = (globalVotes[option] || 0) + 1;
  localStorage.setItem('pattaya_votes_global', JSON.stringify(globalVotes));
  
  // 更新按鈕狀態
  const btn = document.getElementById(`vote-${option}`);
  if (btn) {
    btn.classList.add('voted');
    btn.textContent = '✓ 已投票';
    btn.disabled = true;
  }
  
  // 更新投票計數
  const countElement = document.getElementById(`count-${option}`);
  if (countElement) {
    countElement.textContent = `${globalVotes[option]} 票`;
  }
  
  updateVoteStatus(userVotes);
  
  alert('投票成功！感謝您的參與。');
}

// 頁面加載時初始化投票
window.addEventListener('load', () => {
  initializeVotes();
  updateVoteDisplay();
  
  // 每 3 秒自動刷新一次投票數（模擬即時同步）
  setInterval(() => {
    updateVoteDisplay();
  }, 3000);
});
