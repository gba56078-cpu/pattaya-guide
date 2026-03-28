// ── VOTING SYSTEM (SUPABASE REALTIME SYNC) ──
const VOTE_LIMIT = 2;
const ACCOMMODATION_OPTIONS = ['airbnb-1', 'airbnb-2', 'airbnb-3', 'resort-1', 'resort-2', 'resort-3'];

// Supabase 配置
const SUPABASE_URL = 'https://pattayaguide.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBhdHRheWFndWlkZSIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzA0MDAwMDAwLCJleHAiOjE5MDQwMDAwMDB9.pattaya_guide_voting_key';

const { createClient } = window.supabase;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

let globalVotes = {};
let isLoading = true;

// 初始化 Supabase 投票
async function initializeSupabaseVotes() {
  try {
    // 嘗試從 Supabase 讀取投票數據
    const { data, error } = await supabase
      .from('pattaya_votes')
      .select('*')
      .eq('id', 'votes_total')
      .single();
    
    if (error && error.code !== 'PGRST116') {
      throw error;
    }
    
    if (data) {
      globalVotes = data.votes || {};
    } else {
      // 初始化數據
      globalVotes = {};
      ACCOMMODATION_OPTIONS.forEach(option => {
        globalVotes[option] = 0;
      });
      
      await supabase
        .from('pattaya_votes')
        .insert([{ id: 'votes_total', votes: globalVotes }]);
    }
    
    // 訂閱實時更新
    supabase
      .channel('pattaya_votes_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pattaya_votes' }, (payload) => {
        if (payload.new && payload.new.votes) {
          globalVotes = payload.new.votes;
          updateVoteDisplay();
        }
      })
      .subscribe();
    
    console.log('✓ Supabase 投票系統已初始化');
  } catch (error) {
    console.log('⚠ Supabase 初始化失敗，使用本地數據:', error);
    globalVotes = {};
    ACCOMMODATION_OPTIONS.forEach(option => {
      globalVotes[option] = 0;
    });
  }
  
  isLoading = false;
  updateVoteDisplay();
}

// 更新投票顯示
function updateVoteDisplay() {
  const userVotes = JSON.parse(localStorage.getItem('pattaya_user_votes_supabase')) || [];
  
  ACCOMMODATION_OPTIONS.forEach(option => {
    const count = globalVotes[option] || 0;
    const countElement = document.getElementById(`count-${option}`);
    if (countElement) {
      countElement.textContent = `${count} 票`;
      countElement.style.color = '#ff6b35';
      countElement.style.fontWeight = 'bold';
      countElement.style.fontSize = '16px';
    }
    
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
  if (isLoading) {
    alert('投票系統正在載入中，請稍候...');
    return;
  }
  
  const userVotes = JSON.parse(localStorage.getItem('pattaya_user_votes_supabase')) || [];
  
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
  localStorage.setItem('pattaya_user_votes_supabase', JSON.stringify(userVotes));
  
  // 更新全域投票數
  globalVotes[option] = (globalVotes[option] || 0) + 1;
  
  // 上傳到 Supabase
  try {
    const { error } = await supabase
      .from('pattaya_votes')
      .update({ votes: globalVotes })
      .eq('id', 'votes_total');
    
    if (error) throw error;
    
    console.log('✓ 投票已上傳到 Supabase');
  } catch (error) {
    console.log('⚠ Supabase 上傳錯誤:', error);
    alert('投票上傳失敗，請檢查網路連線');
    return;
  }
  
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

// 頁面加載時初始化
window.addEventListener('load', () => {
  initializeSupabaseVotes();
});

// 頁面變得可見時刷新
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    updateVoteDisplay();
  }
});
