// ==UserScript==
// @name         跳过抖音广告、直播
// @namespace    http://tampermonkey.net/
// @version      2.0.0
// @description  跳过抖音广告、直播，支持配置保存
// @icon         https://p-pc-weboff.byteimg.com/tos-cn-i-9r5gewecjs/favicon.png
// @author       guyuexuan
// @license      MIT
// @updateURL    https://mirror.ghproxy.com/https://raw.githubusercontent.com/FanchangWang/tampermonkey_script/main/douyin_skip_ad.user.js
// @downloadURL  https://mirror.ghproxy.com/https://raw.githubusercontent.com/FanchangWang/tampermonkey_script/main/douyin_skip_ad.user.js
// @match        https://www.douyin.com/*
// @run-at       document-idle
// @grant        GM_registerMenuCommand
// @grant        GM_unregisterMenuCommand
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_log
// @grant        window.onurlchange
// ==/UserScript==

(function () {
    'use strict';

    /**
     * @typedef {object} MenuProp GM_registerMenuCommand 菜单使用的参数
     * @property {number|string?} id 返回的菜单 id
     * @property {string} title 菜单标题
     * @property {boolean} val 菜单值
     */

    /**
     * GM 菜单注册列表
     * @type {{[key: string]: MenuProp}}
     * @property {MenuProp} list_skip_ad - 滑动列表：跳过广告。
     * @property {MenuProp} list_skip_shop - 滑动列表：跳过购物。
     * @property {MenuProp} list_skip_live - 滑动列表：跳过直播。
     * @property {MenuProp} list_set_clarity - 滑动列表：高清画质。
     * @property {MenuProp} list_set_immersive - 滑动列表：开启清屏。
     * @property {MenuProp} child_live_gift - 内嵌直播：关闭礼物特效。
     * @property {MenuProp} child_live_danmu - 内嵌直播：关闭所有弹幕。
     * @property {MenuProp} child_live_quality - 内嵌直播：开启原画画质。
     * @property {MenuProp} child_live_gift_panel - 内嵌直播：关闭礼物面板。
     * @property {MenuProp} child_live_theater - 内嵌直播：自动网页全屏。
     */
    let menuList = {
        "list_skip_ad": { id: "", title: "滑动列表：跳过广告", val: true },
        "list_skip_shop": { id: "", title: "滑动列表：跳过购物", val: true },
        "list_skip_live": { id: "", title: "滑动列表：跳过直播", val: false },
        "list_set_clarity": { id: "", title: "滑动列表：高清画质", val: true },
        "list_set_immersive": { id: "", title: "滑动列表：开启清屏", val: false },

        "child_live_gift": { id: "", title: "内嵌直播：关闭礼物特效", val: true },
        "child_live_danmu": { id: "", title: "内嵌直播：关闭所有弹幕", val: true },
        "child_live_quality": { id: "", title: "内嵌直播：开启原画画质", val: true },
        "child_live_gift_panel": { id: "", title: "内嵌直播：关闭礼物面板", val: true },
        "child_live_theater": { id: "", title: "内嵌直播：自动网页全屏", val: false },
    };

    /** 删除旧版脚本配置的存储值 */
    if (localStorage.getItem("skip-config")) {
        localStorage.removeItem("skip-config");
    }

    /** 遍历注册菜单 */
    function registerMenuCommand() {
        for (const key in menuList) {
            if (menuList[key].id) {
                GM_unregisterMenuCommand(menuList[key].id); // 因为 callbackMenu 回调更新单个菜单会导致被更新的条目出现在菜单末尾导致顺序错误，所以干脆全部删掉重新注册一遍
            }
            menuList[key].val = GM_getValue(key, menuList[key].val);
            menuList[key].id = GM_registerMenuCommand(`${menuList[key].val ? '✅' : '❌'} ${menuList[key].title}`, () => callbackMenu(key, menuList[key].val), { autoClose: false });
        }
    }

    /**
     * 菜单点击回调
     * 
     * @param {string} key 
     * @param {boolean} val 
     */
    function callbackMenu(key, val) {
        menuList[key].val = !val;
        GM_setValue(key, menuList[key].val);
        // menuList[key].id = GM_registerMenuCommand(`${menuList[key].val ? '✅' : '❌'} ${menuList[key].title}`, () => callbackMenu(key, menuList[key].val), { id: menuList[key].id, autoClose: false });
        registerMenuCommand(); // 重新注册菜单
    }

    registerMenuCommand(); // 注册菜单

    /**
     * @typedef {object} SlideProp slidelist video/live 属性
     * @property {string} id xgplayerid
     * @property {boolean} completed 此 id 是否处理完成 默认 false
     * @property {boolean} needSkip 是否需要跳过 默认 false
     * @property {boolean} skipAdCompleted 跳过广告 默认 false
     * @property {boolean} skipShopCompleted 跳过购物 默认 false
     * @property {boolean} skipLiveCompleted 跳过直播 默认 false
     * @property {boolean} setClarityCompleted 画质是否处理完成 默认 false
     * @property {boolean} setImmersiveCompleted 清屏是否处理完成 默认 false
     */

    /**
     * 记录当前指向的 slidelist video/live 信息
     * @type {{[key: string]: SlideProp}}
     */
    let slideVideoObj = {};

    /** @type {string|null} 正在处理的 next xgplayerid */
    let nextXgplayerid;

    /** @type {string[]} 历史已处理的 xgplayerid (包含当前正在处理的) */
    let historyXgplayeridList = [];

    /**
     * 有新的 xgplayerid 产生，初始化值
     * @param {string} xgplayerid 
     */
    function initNewXgplayerid(xgplayerid) {
        slideVideoObj = { [xgplayerid]: { id: xgplayerid, completed: false, needSkip: false, skipAdCompleted: false, skipShopCompleted: false, skipLiveCompleted: false, setClarityCompleted: false, setImmersiveCompleted: false } };
        if (!historyXgplayeridList.some(item => item === xgplayerid)) {
            historyXgplayeridList.push(xgplayerid);
            if (historyXgplayeridList.length > 5) { // 只保留 5 个旧值
                historyXgplayeridList.shift();
            }
        }
    }

    /**
     * 判断是否是历史已处理过的 xgplayerid // 用于向上 ↑ 查看旧视频时，跳过所有处理
     * @param {string} xgplayerid 
     * @returns {boolean}
     */
    function isHistoryXgplayerid(xgplayerid) {
        return historyXgplayeridList.some((item, idx, arr) => item === xgplayerid && idx !== (arr.length - 1));
    }

    /**
     * 点击下一个视频
     * @param {string|null} msg 
     * @param {string} xgplayerid 
     */
    function nextLive(msg = null, xgplayerid) {
        if (nextXgplayerid) {
            return;
        }
        const playerNode = document.querySelector('div#slider-card[data-e2e="feed-live"] div.basicPlayer.xgplayer-playing:not(.xgplayer-pause)');
        if (!playerNode || playerNode.dataset.xgplayerid != xgplayerid) {
            // GM_log("直播: nextLive ID 不同！", xgplayerid, playerNode?.dataset?.xgplayerid);
        } else {
            if (nextXgplayerid) {
                return;
            }
            nextXgplayerid = xgplayerid;
            setTimeout(() => {
                const newPlayerNode = document.querySelector('div#slider-card[data-e2e="feed-live"] div.basicPlayer.xgplayer-playing:not(.xgplayer-pause)');
                if (!newPlayerNode || newPlayerNode.dataset.xgplayerid != xgplayerid) {
                    // GM_log("直播: nextLive new ID 不同！", xgplayerid, newPlayerNode?.dataset?.xgplayerid);
                    nextXgplayerid = null;
                } else {
                    if (msg) {
                        // GM_log("直播: nextLive 自动跳过 " + msg, xgplayerid, newPlayerNode.dataset.xgplayerid);
                    } else {
                        // GM_log("直播: nextLive 再次尝试执行跳过操作", xgplayerid, newPlayerNode.dataset.xgplayerid);
                    }
                    document.querySelector("div.xgplayer-playswitch-next")?.click();
                    nextXgplayerid = null;
                }
            }, 500);
        }
    }

    /**
     * 处理 slidelist live
     * @param {string} xgplayerid 
     * @param {Element} rootElement 
     */
    function procSlideListLive(xgplayerid, rootElement) {

        // GM_log("procSlideList 直播 xgplayerid:", xgplayerid);

        if (isHistoryXgplayerid(xgplayerid)) {
            // GM_log("procSlideList 直播 skip history xgplayerid:", xgplayerid);
            return;
        }

        if (!slideVideoObj.hasOwnProperty(xgplayerid)) {
            initNewXgplayerid(xgplayerid);
        } else if (slideVideoObj[xgplayerid].needSkip) {
            nextLive(null, xgplayerid);
            return;
        } else if (slideVideoObj[xgplayerid].completed) {
            return;
        }

        if (!slideVideoObj[xgplayerid].skipLiveCompleted) { // 直播
            if (menuList.list_skip_live.val) { // 跳过直播
                slideVideoObj[xgplayerid].needSkip = true;
                nextLive("直播", xgplayerid);
            }
            slideVideoObj[xgplayerid].skipLiveCompleted = true;
        }

        if (!slideVideoObj[xgplayerid].skipAdCompleted) { // 广告
            if (menuList.list_skip_ad.val) {
                const spanElements = rootElement.querySelectorAll("span");
                if (Array.from(spanElements).some(el => el.textContent.trim() === "广告" || el.textContent.trim() === "全部商品")) { // 视频描述 这是一条广告直播|带购物车的
                    slideVideoObj[xgplayerid].needSkip = true;
                    slideVideoObj[xgplayerid].skipAdCompleted = true;
                    nextLive("广告", xgplayerid);
                }
                if (Array.from(spanElements).some(el => el.textContent.trim() === "连播")) { // 连播已出现
                    slideVideoObj[xgplayerid].skipAdCompleted = true;
                }
            } else {
                slideVideoObj[xgplayerid].skipAdCompleted = true;
            }
        }

        if (slideVideoObj[xgplayerid].skipAdCompleted) { // 广告处理完毕
            slideVideoObj[xgplayerid].completed = true;
        }
    }

    /**
    ` * 点击下一个视频
    * @param {string|null} msg 
    * @param {string} xgplayerid 
    */
    function nextVideo(msg = null, xgplayerid) {
        if (nextXgplayerid) {
            return;
        }
        const playerNode = document.querySelector('div#sliderVideo[data-e2e="feed-active-video"] div.basePlayerContainer');
        if (!playerNode || playerNode.dataset.xgplayerid != xgplayerid) {
            // GM_log("视频: nextVideo ID 不同！", xgplayerid, playerNode?.dataset?.xgplayerid);
        } else {
            if (nextXgplayerid) {
                return;
            }
            nextXgplayerid = xgplayerid;
            setTimeout(() => {
                const newPlayerNode = document.querySelector('div#sliderVideo[data-e2e="feed-active-video"] div.basePlayerContainer');
                if (!newPlayerNode || newPlayerNode.dataset.xgplayerid != xgplayerid) {
                    // GM_log("视频: nextVideo new ID 不同！", xgplayerid, newPlayerNode?.dataset?.xgplayerid);
                    nextXgplayerid = null;
                } else {
                    if (msg) {
                        // GM_log("视频: nextVideo 自动跳过 " + msg, xgplayerid, newPlayerNode.dataset.xgplayerid);
                    } else {
                        // GM_log("视频: nextVideo 再次尝试执行跳过操作", xgplayerid, newPlayerNode.dataset.xgplayerid);
                    }
                    document.querySelector("div.xgplayer-playswitch-next")?.click();
                    nextXgplayerid = null;
                }
            }, 500);
        }
    }

    /**
     * 处理 slidelist video
     * @param {string} xgplayerid 
     * @param {Element} rootElement 
     */
    function procSlideListVideo(xgplayerid, rootElement) {

        // GM_log("procSlideList 视频 xgplayerid:", xgplayerid);

        if (isHistoryXgplayerid(xgplayerid)) {
            // GM_log("procSlideList 视频 skip history xgplayerid:", xgplayerid);
            return;
        }

        if (!slideVideoObj.hasOwnProperty(xgplayerid)) {
            initNewXgplayerid(xgplayerid);
        } else if (slideVideoObj[xgplayerid].needSkip) {
            nextVideo(null, xgplayerid);
            return;
        } else if (slideVideoObj[xgplayerid].completed) {
            return;
        }

        if (!slideVideoObj[xgplayerid].skipAdCompleted) { // 广告
            if (menuList.list_skip_ad.val) {
                let isAdSvg = true; // 是否是广告 svg
                // 如果包含 svg 的元素中存在 span 说明是 2人共创之类的 
                const videoCreateTimeNode = rootElement.querySelector('div.video-info-detail div.account div.video-create-time');
                if (videoCreateTimeNode && videoCreateTimeNode.nextElementSibling) {
                    if (videoCreateTimeNode.nextElementSibling.querySelector("span")) {
                        isAdSvg = false;
                    }
                }
                if (
                    // 如果包含 svg 的元素中存在 span 说明是 2人共创之类的 // account 中存在 svg 表示 存在 广告或图文 // 图文我没刷到过，所以暂时未做判断
                    (isAdSvg && rootElement.querySelector("div.video-info-detail div.account svg"))
                    || Array.from(rootElement.querySelectorAll("div.video-info-detail div.title[data-e2e='video-desc'] span")).some(el => el.textContent.trim() === "广告") // 视频描述 这是一条广告视频
                ) {
                    slideVideoObj[xgplayerid].needSkip = true;
                    slideVideoObj[xgplayerid].skipAdCompleted = true;
                    nextVideo("广告", xgplayerid);
                }
            } else {
                slideVideoObj[xgplayerid].skipAdCompleted = true;
            }
        }

        if (!slideVideoObj[xgplayerid].skipShopCompleted) { // 购物
            if (menuList.list_skip_shop.val) {
                if (rootElement.querySelector("div.xgplayer-shop-anchor")) {// 这是一条购物视频
                    slideVideoObj[xgplayerid].needSkip = true;
                    slideVideoObj[xgplayerid].skipShopCompleted = true;
                    nextVideo("购物", xgplayerid);
                }
            } else {
                slideVideoObj[xgplayerid].skipShopCompleted = true;
            }
        }

        if (!slideVideoObj[xgplayerid].setImmersiveCompleted) { // 清屏
            if (menuList.list_set_immersive.val) {
                const immersiveSwitchButton = rootElement.querySelector("xg-icon.immersive-switch button");
                if (immersiveSwitchButton) {
                    if (immersiveSwitchButton.classList.contains("xg-switch-checked")) {
                        slideVideoObj[xgplayerid].setImmersiveCompleted = true;
                    } else {
                        immersiveSwitchButton.click();
                    }
                    // rootElement.classList.add("immersive-player-switch-on", "immersive-player-switch-on-hide-video-info");
                    // immersiveSwitchButton.classList.add("xg-switch-checked");
                    // // rootElement.querySelector("xg-icon.immersive-switch div.xgTips span")?.textContent = "取消清屏";
                    // slideVideoObj[xgplayerid].setImmersiveCompleted = true;
                }
            } else {
                slideVideoObj[xgplayerid].setImmersiveCompleted = true;
            }
        }

        if (!slideVideoObj[xgplayerid].setClarityCompleted) { // 高清
            if (menuList.list_set_clarity.val) {
                const divItemElements = rootElement.querySelectorAll("xg-icon.xgplayer-playclarity-setting div.item"); // 画质
                const divItemNode = Array.from(divItemElements).find(el => el.textContent.trim() === "高清");
                if (divItemNode) {
                    if (!divItemNode.classList.contains("selected")) {
                        divItemNode.click(); // 考虑到异步执行 click 修改 class 变更可能会延迟，所以暂时不修改完成标志位，等下次 class 判断再说
                    } else {
                        slideVideoObj[xgplayerid].setClarityCompleted = true;
                    }
                }
            } else {
                slideVideoObj[xgplayerid].setClarityCompleted = true;
            }
        }

        if (slideVideoObj[xgplayerid].setClarityCompleted) { // 画质高清设置完毕
            if (!slideVideoObj[xgplayerid].skipAdCompleted) { // 广告 // 画质比广告判断慢 // 说明发现不了广告，也就是这并不是广告视频
                slideVideoObj[xgplayerid].skipAdCompleted = true;
            }
            if (!slideVideoObj[xgplayerid].skipShopCompleted) { // 购物 // 画质比购物判断慢// 说明发现不了购物，也就是这并不是购物视频
                slideVideoObj[xgplayerid].skipShopCompleted = true;
            }

            if (slideVideoObj[xgplayerid].setImmersiveCompleted) { // 清屏设置完毕
                slideVideoObj[xgplayerid].completed = true;
            }
        }
    }

    /** @type {MutationObserver} slideList observer */
    let observerSlideList = new MutationObserver(function (mutationList) {
        // GM_log("mutationList length: ", mutationList.length);
        /** @type {string[]} 视频 xgplayerid list */
        let videoIds = [];
        /** @type {Element} 视频 rootElementNode 节点 */
        let videoNode;
        /** @type {string[]} 直播 xgplayerid list */
        let liveIds = [];
        /** @type {Element} 直播 rootElementNode 节点*/
        let liveNode;

        mutationList.forEach(function (mutation) {
            if (mutation.type === 'attributes') {
                const targetNode = mutation.target;
                if (targetNode.tagName === 'DIV') {
                    if (mutation.attributeName === "class") {
                        if (targetNode.dataset.e2e === "basicPlayer") { // 判断 slidelist 直播
                            if (targetNode.classList.contains("xgplayer-playing") && !targetNode.classList.contains("xgplayer-nostart") && !targetNode.classList.contains("xgplayer-pause") && !targetNode.classList.contains("isSmallWindow")) {
                                // GM_log("slidelist basicPlayer 直播", targetNode.dataset.xgplayerid, targetNode.className);
                                if (!liveIds.includes(targetNode.dataset.xgplayerid)) {
                                    liveIds.push(targetNode.dataset.xgplayerid);
                                    liveNode = targetNode;
                                }
                            }
                        } else if (targetNode.classList.contains("basePlayerContainer")) { // 判断 slidelist 视频
                            if (targetNode.classList.contains("xgplayer-playing") && !targetNode.classList.contains("xgplayer-nostart") && !targetNode.classList.contains("xgplayer-pause") && !targetNode.classList.contains("isSmallWindow")) {
                                // GM_log("slidelist basePlayerContainer 视频", targetNode.dataset.xgplayerid, targetNode.className);
                                if (!videoIds.includes(targetNode.dataset.xgplayerid)) {
                                    videoIds.push(targetNode.dataset.xgplayerid);
                                    videoNode = targetNode;
                                }
                            }
                        }
                    }
                }
            }
        });

        if (videoIds.length === 1) {
            // GM_log("slidelist active type: 视频", videoIds[0]);
            procSlideListVideo(videoIds[0], videoNode);
        }
        if (liveIds.length === 1) {
            // GM_log("slidelist active type: 直播", liveIds[0]);
            procSlideListLive(liveIds[0], liveNode);
        }
    });

    /**
     * 处理内嵌直播
     * @param {string} xgplayerid 
     * @param {Element} rootElement 
     */
    function procChildLive(xgplayerid, rootElement) {

        // GM_log("procChildLive 内嵌直播", xgplayerid);

        let completed = true; // 是否已全部处理完毕

        if (menuList.child_live_gift_panel.val) { // 关闭礼物面板
            const giftPanelElement = rootElement.querySelector('div.gitBarOptimizeEnabled')?.parentElement;
            // GM_log("giftPanelElement", giftPanelElement?.isConnected);
            if (giftPanelElement) {
                if (giftPanelElement.style.display != "none") {
                    giftPanelElement.style.display = "none";
                }
            } else {
                completed = false;
            }
        }

        if (menuList.child_live_quality.val) { // 开启原画画质
            if (rootElement.querySelector('div[data-e2e="quality"]')?.textContent != "原画") {
                const qualityParent = rootElement.querySelector('div[data-e2e="quality-selector"]');
                if (qualityParent) {
                    const qualityNode = Array.from(qualityParent.childNodes).find(el => el.textContent.trim() === "原画");
                    // GM_log("qualityNode", qualityNode?.isConnected);
                    if (qualityNode) {
                        qualityNode.click();
                    } else {
                        completed = false;
                    }
                } else {
                    completed = false;
                }
            }
        }


        if (menuList.child_live_danmu.val) { // 关闭所有弹幕
            const danmuNode = rootElement.querySelector("xg-icon.danmu-icon"); // 关闭弹幕 节点
            // GM_log("danmuNode", danmuNode?.isConnected);
            if (danmuNode) {
                const danmuTipsNode = danmuNode.querySelector("div.xg-tips");
                if (danmuTipsNode) {
                    if (danmuTipsNode.textContent === "关闭弹幕") { // 字符串状态判断   关闭弹幕/开启弹幕
                        danmuNode.click();
                    }
                } else {
                    completed = false;
                }
            } else {
                completed = false;
            }

        }

        const xgIconElements = rootElement.querySelectorAll("xg-right-grid xg-icon");

        if (menuList.child_live_gift.val) { // 屏蔽礼物特效
            const theaterXgIconNode = Array.from(xgIconElements).find(el => el.textContent.includes("礼物特效")); // 礼物特效 xg-icon 节点
            if (theaterXgIconNode) {
                if (theaterXgIconNode.textContent.startsWith("屏蔽礼物特效")) { // 字符串状态判断   屏蔽礼物特效/开启礼物特效
                    const theaterNode = theaterXgIconNode.querySelector("svg")?.parentElement;
                    // GM_log("theaterNode", theaterNode?.isConnected);
                    if (theaterNode) {
                        theaterNode.click();
                    } else {
                        completed = false;
                    }
                }
            } else {
                completed = false;
            }
        }

        if (menuList.child_live_theater.val) { // 自动网页全屏
            const theaterXgIconNode = Array.from(xgIconElements).find(el => el.textContent.includes("网页全屏")); // 网页全屏 xg-icon 节点
            if (theaterXgIconNode) {
                if (theaterXgIconNode.textContent.startsWith("网页全屏")) { // 字符串状态判断   网页全屏/退出网页全屏
                    const giftNode = theaterXgIconNode.querySelector("svg")?.parentElement; // 网页全屏 节点
                    // GM_log("giftNode", giftNode?.isConnected);
                    if (giftNode) {
                        giftNode.click();
                    } else {
                        completed = false;
                    }
                }
            } else {
                completed = false;
            }
        }

        return completed;
    }

    /** @type {MutationObserver} child live observer */
    let observerChildLive = new MutationObserver(function (mutationList, observer) {
        /** @type {string[]} 直播 xgplayerid list */
        let liveIds = [];
        /** @type {Element} 直播 rootElementNode 节点*/
        let liveNode;
        mutationList.forEach(function (mutation) {
            if (mutation.type === 'attributes') {
                const targetNode = mutation.target;
                if (targetNode.tagName === 'DIV') {
                    if (mutation.attributeName === "class") {
                        if (targetNode.dataset.e2e === "basicPlayer" && targetNode.classList.contains("living_player_child_route")) { // 判断内嵌直播 targetNode.classList.contains("living_player_child_route")
                            // GM_log("child live: basicPlayer 内嵌直播 ", targetNode.dataset.xgplayerid, targetNode.className);
                            if (targetNode.classList.contains("xgplayer") && !targetNode.classList.contains("xgplayer-nostart") && !targetNode.classList.contains("xgplayer-pause") && !targetNode.classList.contains("isSmallWindow")) {
                                if (!liveIds.includes(targetNode.dataset.xgplayerid)) {
                                    liveIds.push(targetNode.dataset.xgplayerid);
                                    liveNode = targetNode.closest("div.child-route-container");
                                }
                            }
                        }
                    }
                }
            }
        });

        if (liveIds.length === 1) {
            // GM_log("child live: 内嵌直播", liveIds[0]);
            if (procChildLive(liveIds[0], liveNode)) {
                observer.disconnect();
                // GM_log("child live: 内嵌直播", liveIds[0], "procChildLive 处理完毕 observer disconnect");
            }
        }
    });

    /** 开启监听 视频列表滚动 */
    function startSlideListObserver() {
        const targetNode = document.querySelector("div#douyin-right-container"); // div#douyin-right-container 这个是全局监控，切换分类页不影响 // div#slidelist 这个每次切换分类需要重新监听
        if (targetNode) {
            // GM_log("start observer slideList");
            observerSlideList.observe(targetNode, { subtree: true, attributes: true, attributeOldValue: true, attributeFilter: ["class"] });
        }
    }

    /**
     * 结束监听 视频列表滚动
     */
    function stopSlideListObserver() {
        // GM_log("stop observer slideList");
        observerSlideList.disconnect();
    }

    /** 开启监听 内嵌直播 */
    function startChildLiveObserver() {
        const targetNode = document.querySelector("div#douyin-right-container"); // div#douyin-right-container 这个是全局监控，切换分类页不影响
        if (targetNode) {
            // GM_log("start observer child live");
            observerChildLive.observe(targetNode, { subtree: true, attributes: true, attributeOldValue: true, attributeFilter: ["class"] });
        }
    }

    /**
     * 结束监听 内嵌直播
     */
    function stopChildLiveObserver() {
        // GM_log("stop observer child live");
        observerChildLive.disconnect();
    }

    startSlideListObserver();

    if (window.onurlchange === null) {
        // GM_log("Listen Event urlchange!");
        window.addEventListener('urlchange', (info) => {
            // GM_log("url change! new url: ", info.url);
            const currentUrl = info.url;
            let results = currentUrl.match(/\/(?:root|follow)\/live\/(\d+)/);
            if (results && results[1]) { // 内嵌直播
                if (!currentUrl.includes('action_type=')) {
                    stopSlideListObserver();
                    startChildLiveObserver();
                }
            } else {
                stopChildLiveObserver();
                startSlideListObserver();
            }
        });
    };
})();