// ==UserScript==
// @name         抖音直播网页全屏、原画
// @namespace    http://tampermonkey.net/
// @version      1.1.0
// @description  抖音直播自动开启网页全屏、自动切换原画、关闭礼物特效、关闭弹幕
// @icon         https://p-pc-weboff.byteimg.com/tos-cn-i-9r5gewecjs/favicon.png
// @author       guyuexuan
// @license      MIT
// @updateURL    https://mirror.ghproxy.com/https://raw.githubusercontent.com/FanchangWang/tampermonkey_script/main/douyin_live_theater.user.js
// @downloadURL  https://mirror.ghproxy.com/https://raw.githubusercontent.com/FanchangWang/tampermonkey_script/main/douyin_live_theater.user.js
// @match        https://live.douyin.com/*
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    /** @type {{ theater: Element | null, gift: Element | null, danmu: Element | null, quality: Element | null }} */
    let buttonList = { theater: null, gift: null, danmu: null, quality: null };

    /**
     * 获取网页全屏按钮
     * 
     * @returns {Element|null}
     */
    function getButtonList() {
        let isTheaterNode = false;
        let isGiftNode = false;
        let targetNode = null;

        if (!buttonList.quality) {
            const qualityParent = document.querySelector('div[data-e2e="quality-selector"]');
            if (qualityParent) {
                for (const divNode of qualityParent.childNodes) {
                    if (divNode.textContent.trim() === '原画') {
                        buttonList.quality = divNode;
                        break;
                    }
                }
            }
        }
        if (!buttonList.quality) {
            return false;
        }
        const xgIconElements = document.querySelectorAll('xg-right-grid xg-icon');
        for (const xgIconNode of xgIconElements) {
            isTheaterNode = false;
            isGiftNode = false;
            targetNode = null;
            const divElements = xgIconNode.querySelectorAll('div');
            for (const divNode of divElements) {
                if (divNode.textContent.trim() === '网页全屏') {
                    isTheaterNode = true;
                }
                if (divNode.textContent.trim() === '屏蔽礼物特效') {
                    isGiftNode = true;
                }
                if (divNode.textContent.trim() === '关闭弹幕') {
                    buttonList.danmu = divNode;
                    break;
                }
                if (divNode.firstElementChild && divNode.firstElementChild.tagName === 'svg') {
                    targetNode = divNode;
                }
            }
            if (isTheaterNode && targetNode) {
                buttonList.theater = targetNode;
            }
            if (isGiftNode && targetNode) {
                buttonList.gift = targetNode;
            }
            if (buttonList.theater && buttonList.gift && buttonList.danmu) {
                return true;
            }
        }
        return false;
    }

    /** @type {RegExp} */
    const regex = /^\/\d+/;
    if (regex.test(window.location.pathname)) {
        /** @type {number} 计数器，防止检测不到元素一直循环 */
        let counter = 0;
        const timerButtonList = setInterval(() => {
            if (getButtonList()) {
                clearInterval(timerButtonList);
                buttonList.theater.click();
                buttonList.gift.click();
                buttonList.danmu.click();
                buttonList.quality.click();
            } else {
                if (counter++ > 20) {
                    clearInterval(timerButtonList);
                }
            }
        }, 300);
    }
})();

