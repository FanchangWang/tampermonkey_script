// ==UserScript==
// @name         跳过抖音广告、直播
// @namespace    http://tampermonkey.net/
// @version      1.4.0
// @description  跳过抖音广告、直播，支持配置保存
// @icon         https://p-pc-weboff.byteimg.com/tos-cn-i-9r5gewecjs/favicon.png
// @author       guyuexuan
// @license      MIT
// @updateURL    https://mirror.ghproxy.com/https://raw.githubusercontent.com/FanchangWang/tampermonkey_script/main/douyin_skip_ad.user.js
// @downloadURL  https://mirror.ghproxy.com/https://raw.githubusercontent.com/FanchangWang/tampermonkey_script/main/douyin_skip_ad.user.js
// @match        https://www.douyin.com/*
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    /** @type {number} */
    let lastTranslateValue = 1;

    /** @type {Element} 视频列表上层 div 节点 */
    let targetNode = null;
    /** @type {MutationObserver} */
    let observer = null;
    /** @type {Array} 配置开关 */
    let configxgIcon = [
        { name: "广告", option: true, type: "ad" },
        { name: "直播", option: false, type: "live" },
        { name: "购物", option: true, type: "shop" },
        { name: "清屏", option: false, type: "immersive" },
    ];
    /**
     * 初始化配置
     */
    if (!localStorage.getItem("skip-config")) {
        localStorage.setItem("skip-config", JSON.stringify(configxgIcon))

    } else if (JSON.parse(localStorage.getItem("skip-config")).length != configxgIcon.length) {
        localStorage.setItem("skip-config", JSON.stringify(configxgIcon))
    } else {
        configxgIcon = JSON.parse(localStorage.getItem("skip-config"))
    }

    /**
     * 显示提示框并延迟隐藏
     * 
     * @param {string} message 
     */
    function showToast(message) {
        let toastElement = document.querySelector("div#skip-toast"); // 查找提示框元素
        if (!toastElement) { // 如果提示框不存在，则创建新的提示框元素
            toastElement = document.createElement('div');
            toastElement.id = "skip-toast"
            toastElement.style.position = 'fixed';
            toastElement.style.top = '80%'; // 设置垂直位置为屏幕的80%
            toastElement.style.left = '50%'; // 设置水平位置为屏幕的中心
            toastElement.style.transform = 'translateX(-50%)'; // 将提示框水平居中
            toastElement.style.padding = '10px';
            toastElement.style.background = '#333';
            toastElement.style.color = '#fff';
            toastElement.style.borderRadius = '5px';
            toastElement.style.zIndex = '9999';
            toastElement.innerHTML = message;
            document.body.appendChild(toastElement); // 将提示框添加到页面中
        } else {
            // 获取实际应用于元素的 display 属性
            let displayStyle = window.getComputedStyle(toastElement).getPropertyValue('display');
            toastElement.innerHTML = displayStyle == 'block' ? (toastElement.innerHTML + '<br>' + message) : message; // 设置提示框文本内容
        }
        toastElement.style.display = 'block'; // 显示提示框
        setTimeout(() => { // 延迟隐藏提示框
            toastElement.style.display = 'none';
        }, 3000);
    }

    /**
     * 打开清屏
     */
    function openImmersive() {
        let playerElement = document.querySelector('div.dySwiperSlide div[data-e2e="feed-active-video"] div.basePlayerContainer');
        if (playerElement) {
            playerElement.classList.add("immersive-player-switch-on", "immersive-player-switch-on-hide-video-info");
        }
    }

    /**
     * 关闭清屏
     */
    function closeImmersive() {
        let playerElement = document.querySelector('div.dySwiperSlide div[data-e2e="feed-active-video"] div.basePlayerContainer');
        if (playerElement) {
            playerElement.classList.remove("immersive-player-switch-on", "immersive-player-switch-on-hide-video-info");
        }
    }

    /** @type {number} 隐藏配置页面定时器 */
    let timerHideSkipConfig;

    // 增加 skip 配置
    function addSkipConfigElement() {
        if (!document.querySelector('div.dySwiperSlide div[data-e2e="feed-active-video"] span#skip-config')) {
            let config = document.querySelector('div.dySwiperSlide div[data-e2e="feed-active-video"] .xg-right-grid')
            let xgIcon = document.createElement("xg-icon")
            xgIcon.className = "xgplayer-autoplay-setting automatic-continuous"
            xgIcon.dataset.index = 99
            xgIcon.innerHTML = `
        <div class="xgplayer-icon">
            <div class="xgplayer-setting-label">
                <span class="xg-switch-inner"></span>
                <span class="xgplayer-setting-title" id="skip-config">配置</span>
            </div>
        </div>
        <div class="xgTips"><br></div>
        `
            for (const item of configxgIcon) {
                let icon = `
            <div class="xgplayer-icon">
                <div class="xgplayer-setting-label">
                    <button data-type="${item.type}" aria-checked="true" class="${item.option ? "xg-switch-checked" : ""} xg-switch" aria-labelledby="xg-switch-pip" type="button">
                    <span class="xg-switch-inner"></span>
                </button>
                <span class="xgplayer-setting-title">${item.name}</span>
            </div>
            `
                let range = document.createRange();
                let iconitem = range.createContextualFragment(icon);
                let button = iconitem.querySelector("button");
                let xgTips = xgIcon.querySelector(".xgTips");
                xgTips.style.display = "none";
                xgTips.style.visibility = "visible";
                button.onclick = () => {
                    if (item.option == true) {
                        item.option = false
                        button.classList.remove("xg-switch-checked");
                        localStorage.setItem("skip-config", JSON.stringify(configxgIcon));
                    } else {
                        item.option = true
                        button.classList.add("xg-switch-checked");
                        localStorage.setItem("skip-config", JSON.stringify(configxgIcon));
                    }
                }
                xgIcon.onmouseover = () => {
                    clearTimeout(timerHideSkipConfig);
                    xgTips.style.display = "block";
                }
                xgIcon.onmouseleave = () => {
                    timerHideSkipConfig = setTimeout(() => {
                        xgTips.style.display = "none";
                    }, 1500);
                }
                xgTips.onclick = (e) => {
                    e.stopPropagation();
                    let targetItem = e.target
                    if (targetItem.nodeName == "BUTTON") {
                        if (targetItem.dataset.type == "immersive") {
                            if (targetItem.classList.contains("xg-switch-checked")) {
                                openImmersive();
                            } else {
                                closeImmersive();
                            }
                        }
                    }
                }
                xgTips.appendChild(iconitem)
            }
            config?.appendChild(xgIcon)
        }
    }

    /**
     * 点击下一个视频
     * @param {string} msg 
     */
    function nextVideo(msg) {
        document.querySelector('div.xgplayer-playswitch-next')?.click();
        showToast("脚本提示：自动跳过 " + msg);
    }

    /**
     * 检查是否需要跳过广告
     * 
     * @param {Element} descElement 
     * @returns bool
     */
    function checkAd(descElement) {
        if (!configxgIcon[0].option) {
            return false;
        }
        let spanElements = descElement.querySelectorAll('span');
        return Array.from(spanElements).some(function (spanElement) { // 跳过广告 && 存在广告
            return spanElement.textContent.trim() === '广告';
        });
    }

    /**
     * 检查是否需要跳过购物
     * 
     * @returns bool
     */
    function checkShop(rootElement) {
        return configxgIcon[2].option && rootElement.querySelector('div.xgplayer-shop-anchor'); // 跳过购物 && 存在购物
    }



    function procSkipLive(rootElement) {
        if (configxgIcon[1].option) { // 跳过直播
            nextVideo("直播");
            return;
        }
        let descElement = rootElement.querySelector('div.basicPlayer'); // 直播 描述元素
        if (!descElement) {
            return;
        }
        if (checkAd(descElement)) {
            nextVideo("广告");
        }
    }

    function procSkipVideo(rootElement) {
        let descElement = rootElement.querySelector('div.video-info-detail div[data-e2e="video-desc"]'); // 视频 描述元素
        if (!descElement) {
            return;
        }
        if (checkAd(descElement) || checkShop(rootElement)) {
            nextVideo("广告或购物");
            return;
        }
        if (configxgIcon[3].option) { // 清屏
            openImmersive();
            setTimeout(() => {
                openImmersive();
            }, 600);
        }
        addSkipConfigElement(); // 添加配置菜单
    }

    function skipMain() {
        let rootElement; // 视频/直播 根元素
        rootElement = document.querySelector('div.dySwiperSlide div[data-e2e="feed-active-video"]');
        if (rootElement) {
            procSkipVideo(rootElement);
        } else {
            rootElement = document.querySelector('div.dySwiperSlide div[data-e2e="feed-live"]');
            if (rootElement) {
                procSkipLive(rootElement);
            } else {
                return;
            }
        }
    }

    /**
     * 等待页面初始化完毕 页面中出现第一个视频/直播
     * 
     * @returns bool
     */
    function waitMain() {
        let rootElement; // 视频/直播 根元素
        rootElement = document.querySelector('div.dySwiperSlide div[data-e2e="feed-active-video"]');
        if (!rootElement) {
            rootElement = document.querySelector('div.dySwiperSlide div[data-e2e="feed-live"]');
        }
        return rootElement;
    }

    /**
     * start observer 开始监听视频切换
     */
    function startObserver() {
        // 创建 MutationObserver 实例
        observer = new MutationObserver(function (mutations) {
            mutations.forEach(function (mutation) {
                if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                    // 获取元素样式
                    let style = mutation.target.style;
                    let match;
                    /** @type {string} */
                    let lastTransitionDuration = '';
                    if (mutation.oldValue) {
                        match = mutation.oldValue.match(/transition-duration: ([0-9ms]+);/);
                        if (match) {
                            lastTransitionDuration = match[1];
                        }
                    }
                    if (style.transitionDuration != "0ms") {
                        return;
                    }
                    if (lastTransitionDuration) { // 存在旧值的时候需要判断
                        if (lastTransitionDuration != "250ms") {
                            return;
                        }
                    }
                    match = style.transform.match(/translate3d\(-?\d+px, (-?\d+)px, -?\d+px\)/);
                    if (match) {
                        let newTranslateValue = parseInt(match[1]);
                        if (newTranslateValue < lastTranslateValue) {
                            lastTranslateValue = newTranslateValue;
                            skipMain();
                        }
                    }
                }
            });
        });

        // 监听属性变化中的 style 变化
        var config = { attributes: true, attributeOldValue: true, attributeFilter: ['style'] };
        observer.observe(targetNode, config);
    }

    /**
     * stop observer 停止监听
     */
    function stopObserver() {
        if (observer) {
            observer.disconnect()
        }
        lastTranslateValue = 1; // 初始化变量
    }

    /**
     * restart observer 重启监听
     */
    function restartObserver() {
        stopObserver();
        skipMain();
        startObserver();
    }

    let timerWaitMain = setInterval(() => {
        if (waitMain()) {
            clearInterval(timerWaitMain);
            /**
             * 定时监听视频列表上层 div 是否发生变化
             * 如果发生变化则进行切换
             */
            setInterval(() => {
                /** @type {Element} */
                let newTargetNode = document.querySelector('#slidelist .fullscreen_capture_feedback div');
                if (newTargetNode) {
                    if (newTargetNode != targetNode) {
                        targetNode = newTargetNode;
                        restartObserver();
                    }
                } else {
                    stopObserver();
                }
            }, 500);
        }
    }, 500);
})();

