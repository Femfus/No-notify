/**
 * @name No-Notify
 * @author femfus
 * @authorLink https://github.com/Zerthox
 * @description No-Notify is a plugin that mutes all servers within seconds!
 * @version 1.0.0
 */

module.exports = class NoNotify {
    constructor() {
        this.initialized = false;
    }

    getName() { return "No-Notify"; }
    getDescription() { return "No-Notify is a plugin that mutes all servers within seconds!"; }
    getVersion() { return "1.0.0"; }
    getAuthor() { return "You"; }

    start() {
        // Load the required modules
        const { Webpack, Webpack: { Filters } } = BdApi;
        this.GuildStore = Webpack.getModule(Filters.byProps("getGuilds"));
        this.GuildSettingsStore = Webpack.getModule(Filters.byProps("updateGuildNotificationSettings"));
        this.GuildNotificationSettingsModal = Webpack.getModule(m => m?.default?.displayName === "GuildNotificationSettingsModal");
        this.DiscordComponents = {
            Button: Webpack.getModule(m => m?.default?.displayName === "Button")?.default,
            Tooltip: Webpack.getModule(m => m?.default?.displayName === "Tooltip")?.default
        };

        // Create and add the button
        this.addNoNotifyButton();
        this.initialized = true;
        console.log(`${this.getName()} v${this.getVersion()} has started!`);
    }

    stop() {
        this.removeNoNotifyButton();
        this.initialized = false;
        console.log(`${this.getName()} has stopped!`);
    }

    addNoNotifyButton() {
        // Try multiple selectors to find the guilds header
        const selectors = [
            '.guilds-1SWlCJ header', 
            '.guilds-2JjMmN header',
            '.wrapper-3NnKdC nav',
            'nav[aria-label="Servers sidebar"]',
            '.scroller-1Bvpku'
        ];
        
        let headerBar = null;
        for (const selector of selectors) {
            headerBar = document.querySelector(selector);
            if (headerBar) break;
        }
        
        // If we couldn't find the header, try again in a second
        if (!headerBar) return setTimeout(() => this.addNoNotifyButton(), 1000);

        // Create our button
        this.noNotifyButton = document.createElement('div');
        this.noNotifyButton.className = 'no-notify-button';
        this.noNotifyButton.innerHTML = `
            <svg width="24" height="24" viewBox="0 0 24 24">
                <path fill="currentColor" d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2zm-2 1H8v-6c0-2.48 1.51-4.5 4-4.5s4 2.02 4 4.5v6z"/>
                <path fill="red" d="M4.707 3.293L3.293 4.707 19.293 20.707L20.707 19.293z"/>
            </svg>
        `;
        
        // Add styling
        const style = document.createElement('style');
        style.id = 'no-notify-style';
        style.textContent = `
            .no-notify-button {
                display: flex;
                align-items: center;
                justify-content: center;
                width: 48px;
                height: 48px;
                border-radius: 50%;
                margin: 4px auto;
                cursor: pointer;
                color: var(--interactive-normal);
                background-color: var(--background-secondary);
                transition: background-color .2s ease-in-out;
                position: relative;
                z-index: 1000;
            }
            .no-notify-button:hover {
                background-color: var(--background-modifier-hover);
                color: var(--interactive-hover);
            }
            .no-notify-button.active {
                background-color: rgba(255, 0, 0, 0.2);
            }
            .no-notify-tooltip {
                position: absolute;
                background-color: black;
                color: white;
                padding: 5px 10px;
                border-radius: 5px;
                font-size: 14px;
                white-space: nowrap;
                z-index: 1001;
                pointer-events: none;
                opacity: 0;
                transition: opacity 0.2s;
            }
            .no-notify-button:hover .no-notify-tooltip {
                opacity: 1;
            }
            .no-notify-modal {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background-color: var(--background-primary);
                border-radius: 8px;
                box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
                padding: 20px;
                z-index: 9999;
                text-align: center;
                min-width: 300px;
            }
            .no-notify-modal-title {
                font-size: 24px;
                font-weight: bold;
                margin-bottom: 10px;
                color: var(--header-primary);
            }
            .no-notify-modal-button {
                background-color: var(--brand-experiment);
                color: white;
                border: none;
                border-radius: 3px;
                padding: 8px 16px;
                margin-top: 15px;
                cursor: pointer;
                font-size: 14px;
                font-weight: 500;
                transition: background-color 0.2s;
            }
            .no-notify-modal-button:hover {
                background-color: var(--brand-experiment-560);
            }
            .no-notify-modal-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background-color: rgba(0, 0, 0, 0.7);
                z-index: 9998;
            }
        `;
        document.head.appendChild(style);
        
        // Add tooltip
        const tooltip = document.createElement('div');
        tooltip.className = 'no-notify-tooltip';
        tooltip.textContent = 'Mute All Servers';
        tooltip.style.left = '60px';
        tooltip.style.top = '12px';
        this.noNotifyButton.appendChild(tooltip);
        
        // Add event listener
        this.noNotifyButton.addEventListener('click', () => this.muteAllServers());
        
        // Add the button to the header
        if (headerBar.tagName.toLowerCase() === 'nav') {
            // For nav elements, insert at the beginning
            headerBar.insertBefore(this.noNotifyButton, headerBar.firstChild);
        } else {
            // For header elements, use prepend
            headerBar.prepend(this.noNotifyButton);
        }
    }

    removeNoNotifyButton() {
        const button = document.querySelector('.no-notify-button');
        if (button) button.remove();
        
        const style = document.getElementById('no-notify-style');
        if (style) style.remove();
    }

    // Show custom completion modal
    showCompletionModal(totalGuilds) {
        // Create overlay
        const overlay = document.createElement('div');
        overlay.className = 'no-notify-modal-overlay';
        document.body.appendChild(overlay);
        
        // Create modal
        const modal = document.createElement('div');
        modal.className = 'no-notify-modal';
        modal.innerHTML = `
            <div class="no-notify-modal-title">All servers have been muted!</div>
            <div class="no-notify-modal-content">Successfully muted ${totalGuilds} server${totalGuilds !== 1 ? 's' : ''}.</div>
            <button class="no-notify-modal-button">OK</button>
        `;
        document.body.appendChild(modal);
        
        // Add button click handler
        const button = modal.querySelector('.no-notify-modal-button');
        button.addEventListener('click', () => {
            overlay.remove();
            modal.remove();
        });
        
        // Auto close after 5 seconds
        setTimeout(() => {
            if (document.body.contains(overlay)) overlay.remove();
            if (document.body.contains(modal)) modal.remove();
        }, 5000);
    }

    muteAllServers() {
        // Show active state
        this.noNotifyButton.classList.add('active');
        
        // Get all guilds
        const guilds = this.GuildStore.getGuilds();
        let mutedCount = 0;
        const totalGuilds = Object.keys(guilds).length;
        
        if (totalGuilds === 0) {
            BdApi.showToast("No servers found to mute.", { type: "error" });
            setTimeout(() => {
                this.noNotifyButton.classList.remove('active');
            }, 1000);
            return;
        }
        
        // Create notification settings (mute all)
        const muteSettings = {
            muted: true,
            suppress_everyone: true,
            suppress_roles: true,
            mobile_push: false
        };
        
        // Show progress toast
        BdApi.showToast(`Muting all ${totalGuilds} servers...`, { type: "info" });
        
        // Iterate through all guilds and mute them
        for (const guildId in guilds) {
            this.GuildSettingsStore.updateGuildNotificationSettings(guildId, muteSettings)
                .then(() => {
                    mutedCount++;
                    
                    // Update progress if we're halfway through
                    if (mutedCount === Math.floor(totalGuilds / 2)) {
                        BdApi.showToast(`Muted ${mutedCount}/${totalGuilds} servers...`, { type: "info" });
                    }
                    
                    if (mutedCount === totalGuilds) {
                        // All guilds muted successfully
                        // Show our custom modal instead of a toast
                        this.showCompletionModal(totalGuilds);
                        
                        // Remove active state after 1 second
                        setTimeout(() => {
                            this.noNotifyButton.classList.remove('active');
                        }, 1000);
                    }
                })
                .catch(error => {
                    console.error(`Failed to mute guild ${guildId}:`, error);
                    // Continue with other guilds even if one fails
                    mutedCount++;
                    
                    if (mutedCount === totalGuilds) {
                        BdApi.showToast(`Completed with some errors. Check console for details.`, { type: "warning" });
                        setTimeout(() => {
                            this.noNotifyButton.classList.remove('active');
                        }, 1000);
                    }
                });
        }
    }

    // Helper method to log to console
    log(message) {
        console.log(`%c[${this.getName()}]%c ${message}`, 'color: #3a71c1; font-weight: 700;', '');
    }

    // Observer for handling dynamic Discord updates
    observer(changes) {
        // Check if our button exists, if not try to add it again
        // This handles Discord's dynamic UI changes
        if (!document.querySelector('.no-notify-button')) {
            this.addNoNotifyButton();
        }
    }
};