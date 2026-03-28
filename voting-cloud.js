// ── VOTING SYSTEM (CLOUD SYNC WITH JSONBIN) ──
const VOTE_LIMIT = 2;
const ACCOMMODATION_OPTIONS = ['airbnb-1', 'airbnb-2', 'airbnb-3', 'resort-1', 'resort-2', 'resort-3'];
const JSONBIN_BIN_ID = '67a6dc0837c5b90d4a1e7c9e';
const JSONBIN_API_KEY = '$2b$10$dXJpX3BhdHRheWFfZ3VpZGVfMjAyNg==';
let globalVotes = {};

// 從雲端載入投票數據
async function loadVotesFromCloud() {
  try {
    const response = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}`, {
      method: 'GET',
      headers: {
        'X-Master-Key': JSONBIN_API_KEY,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      globalVotes = data.record || {};
      console.log('從雲端載入投票數據:', globalVotes);
    } else {
      console.log('雲端載入失敗，使用本機數據');
      loadVotesFromLocal();
    }
  } catch (error) {
    console.log('雲端連線失敗:', error);
    loadVotesFromLocal();
  }
  
  // 確保所有選項都有初始值
  ACCOMMODATION_OPTIONS.forEach(option => {
    if (!(option in globalVotes)) {
      globalVotes[option] = 0;
    }
  });
  
  updateVoteDisplay();
}

// 從本機載入投票數據（備用）
function loadVotesFromLocal() {
  const savedVotes = localStorage.getItem('pattaya_votes_global');
  if (savedVotes) {
    try {
      globalVotes = JSON.parse(savedVotes);
    } catch (e) {
      globalVotes = {};
    }
  }
  
  ACCOMMODATION_OPTIONS.forEach(option => {
    if (!(option in globalVotes)) {
      globalVotes[option] = 0;
    }
  });
}

// 上傳投票數據到雲端
async function saveVotesToCloud() {
  try {
    const response = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}`, {
      method: 'PUT',
      headers: {
        'X-Master-Key': JSONBIN_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(globalVotes)
    });
    
    if (response.ok) {
      console.log('投票數據已上傳到雲端');
      return true;
    } else {
      console.log('雲端上傳失敗');
      return false;
    }
  } catch (error) {
    console.log('雲端上傳錯誤:', error);
    return false;
  }
}

// 更新投票顯示
function updateVoteDisplay() {
  const userVotes = JSON.parse(localStorage.getItem('pattaya_user_votes')) || [];
  
  ACCOMMODATION_OPTIONS.forEach(option => {
    // 確保票數正確顯示
    const count = globalVotes[option] || 0;
    const countElement = document.getElementById(`count-${option}`);
    if (countElement) {
      countElement.textContent = `${count} 票`;
      countElement.style.display = 'block';
    }
    
    // 更新按鈕狀態
    const btn = document.getElementById(`vote-${option}`);
    if (btn) {
      if (userVotes.includes(option)) {
        btn.classList.add('voted');
        btn.textContent = '✓ 已投票';
        btn.disabled = true;
      } else {
        btn.classList.remove('voted');
        btn.textContent = '👍 投票';
        btn.disabled = false;
      }
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

async function voteAccommodation(option) {
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
  
  // 上傳到雲端
  const uploadSuccess = await saveVotesToCloud();
  
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
  
  // 立即從雲端重新載入以確保所有裝置同步
  setTimeout(loadVotesFromCloud, 500);
}

// 重置投票的函數
async function resetAllVotes() {
  if (confirm('確定要重置所有投票嗎？此操作無法撤銷。')) {
    globalVotes = {};
    ACCOMMODATION_OPTIONS.forEach(option => {
      globalVotes[option] = 0;
    });
    
    localStorage.removeItem('pattaya_votes_global');
    localStorage.removeItem('pattaya_user_votes');
    
    // 上傳重置後的數據到雲端
    await saveVotesToCloud();
    
    alert('投票已重置！');
    location.reload();
  }
}

// 頁面加載時初始化投票
window.addEventListener('load', () => {
  loadVotesFromCloud();
  
  // 立即刷新一次以確保顯示
  setTimeout(loadVotesFromCloud, 100);
  
  // 每 3 秒自動從雲端重新載入投票數（確保即時同步）
  setInterval(() => {
    loadVotesFromCloud();
  }, 3000);
});

// 確保在頁面變得可見時更新投票
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    loadVotesFromCloud();
  }
});
