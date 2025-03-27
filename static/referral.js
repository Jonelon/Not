document.addEventListener('DOMContentLoaded', function() {
    const tg = window.Telegram.WebApp;
    tg.expand();
    
    const totalReferralsEl = document.getElementById('total-referrals');
    const earnedPointsEl = document.getElementById('earned-points');
    const referralLinkEl = document.getElementById('referral-link');
    const copyBtn = document.getElementById('copy-link');
    const shareBtn = document.getElementById('share-btn');
    
    async function loadReferralStats() {
        try {
            const response = await fetch('/api/referral/stats', {
                headers: {
                    'X-Telegram-InitData': tg.initData
                }
            });
            
            if (!response.ok) throw new Error('Failed to load stats');
            
            const data = await response.json();
            totalReferralsEl.textContent = data.referral_count;
            earnedPointsEl.textContent = data.earned_points;
            referralLinkEl.value = data.referral_link;
        } catch (error) {
            console.error('Referral stats error:', error);
            tg.showAlert('Failed to load referral stats');
        }
    }
    
    copyBtn.addEventListener('click', () => {
        referralLinkEl.select();
        document.execCommand('copy');
        tg.showAlert('Link copied to clipboard!');
    });
    
    shareBtn.addEventListener('click', () => {
        const message = `Join me and get 10 free points! Use my link: ${referralLinkEl.value}`;
        
        if (tg.isVersionAtLeast('6.0')) {
            tg.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(referralLinkEl.value)}&text=${encodeURIComponent(message)}`);
        } else {
            tg.showAlert('Please update Telegram to use sharing');
        }
    });
    
    loadReferralStats();
});