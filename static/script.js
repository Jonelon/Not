document.addEventListener('DOMContentLoaded', function() {
    const tg = window.Telegram.WebApp;
    tg.expand();
    
 
    const pointsValue = document.getElementById('points-value');
    const togglePointsBtn = document.getElementById('toggle-points');
    const walletButton = document.getElementById('wallet-button');
    const walletInfo = document.getElementById('wallet-info');
    const walletAddress = document.getElementById('wallet-address');
    const walletBalance = document.getElementById('wallet-balance');
    
 
    let userState = {
        points: 0,
        pointsActive: false,
        walletConnected: false
    };
    
 
    async function updatePoints() {
        try {
            const response = await fetch('/api/user', {
                headers: {
                    'X-Telegram-InitData': tg.initData
                }
            });
            
            if (!response.ok) throw new Error('Failed to fetch points');
            
            const data = await response.json();
            userState.points = data.points;
            userState.pointsActive = data.points_active;
            
            pointsValue.textContent = data.points.toFixed(2);
            togglePointsBtn.textContent = data.points_active 
                ? 'Stop Earning Points' 
                : 'Start Earning Points';
                
            return data;
        } catch (error) {
            console.error('Points update error:', error);
            tg.showAlert('Failed to update points');
        }
    }
    
    async function togglePoints() {
        try {
            togglePointsBtn.disabled = true;
            const response = await fetch('/api/toggle_points', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Telegram-InitData': tg.initData
                }
            });
            
            if (!response.ok) throw new Error('Failed to toggle points');
            
            const data = await response.json();
            if (data.success) {
                userState.pointsActive = data.points_active;
                togglePointsBtn.textContent = data.points_active 
                    ? 'Stop Earning Points' 
                    : 'Start Earning Points';
                tg.showAlert(data.message);
                await updatePoints();
            }
        } catch (error) {
            console.error('Toggle points error:', error);
            tg.showAlert('Error changing points status');
        } finally {
            togglePointsBtn.disabled = false;
        }
    }
    

    async function updateWallet() {
        if (!tg.initDataUnsafe?.user?.wallet_address) {
            walletInfo.style.display = 'none';
            return;
        }
        
        try {
            const address = tg.initDataUnsafe.user.wallet_address;
            walletAddress.textContent = `Address: ${address}`;
            
            const response = await fetch(`/api/wallet/balance?address=${address}`, {
                headers: {
                    'X-Telegram-InitData': tg.initData
                }
            });
            
            if (!response.ok) throw new Error('Failed to fetch balance');
            
            const data = await response.json();
            walletBalance.textContent = `Balance: ${data.balance} ${data.currency}`;
            walletInfo.style.display = 'block';
            userState.walletConnected = true;
        } catch (error) {
            console.error('Wallet error:', error);
            walletInfo.style.display = 'none';
        }
    }
    
    function connectWallet() {
        if (tg.isVersionAtLeast('6.4')) {
            tg.openWallet({
                callbackUrl: window.location.href
            }, function(status) {
                if (status === 'opened') {
                    setTimeout(updateWallet, 1000);
                }
            });
        } else {
            tg.showAlert('Please update Telegram to use Wallet');
        }
    }
    

    document.getElementById('open-drawing').addEventListener('click', () => {
        window.location.href = '/drawing';
    });
    
    document.getElementById('open-earn').addEventListener('click', () => {
        window.location.href = '/earn';
    });
    
    document.getElementById('open-top').addEventListener('click', () => {
        window.location.href = '/top';
    });

function initReferralSystem() {
    const openReferralBtn = document.getElementById('open-referral');
    if (!openReferralBtn) return;

    openReferralBtn.addEventListener('click', async () => {
        try {
            const newWindow = window.open('/invite', '_blank');
            
            if (!newWindow) {
                tg.showAlert('Please allow pop-ups to see referral page');
                return;
            }
            
            if (tg.isVersionAtLeast('6.0')) {
                tg.openLink(`/invite`, {
                    try_instant_view: false
                });
            }
        } catch (error) {
            console.error('Referral system error:', error);
            tg.showAlert('Failed to open referral page');
        }
    });

    const startParam = tg.initDataUnsafe.start_param;
    if (startParam && startParam.startsWith('ref_')) {
        processReferral(startParam.split('ref_')[1]);
    }
}

async function processReferral(referrerId) {
    try {
        const response = await fetch('/api/referral', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Telegram-InitData': tg.initData
            },
            body: JSON.stringify({
                referred_id: tg.initDataUnsafe.user.id,
                referrer_id: referrerId
            })
        });
        
        if (!response.ok) throw new Error('Failed to process referral');
        
        const data = await response.json();
        if (data.success) {
            tg.showAlert(`You got 10 bonus points from referral!`);
            await updatePoints();
        }
    } catch (error) {
        console.error('Referral processing error:', error);
    }
}


async function initApp() {
    tg.ready();
    tg.expand();
    
    await updatePoints();
    await updateWallet();
    initReferralSystem();
    
}
    
    initApp();
});