// ==UserScript==
// @name         抖音直播网页全屏、原画
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @description  抖音直播自动开启网页全屏、自动切换原画
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

    /**
     * 获取网页全屏按钮
     * 
     * @returns {Element|null}
     */
    function getTheaterButton() {
        const xgIconElements = document.querySelectorAll('xg-right-grid xg-icon');
        for (const xgIconNode of xgIconElements) {
            const divElements = xgIconNode.querySelectorAll('div');
            const isTheaterNode = Array.from(divElements).some(function (divNode) {
                return divNode.textContent.trim() === '网页全屏';
            });
            if (isTheaterNode) {
                for (const divNode of divElements) {
                    if (divNode.firstElementChild && divNode.firstElementChild.tagName === 'svg') {
                        return divNode;
                    }
                }
            }
        }
        return null;
    }

    /**
     * 获取原画按钮
     * 
     * @returns {Element|null}
     */
    function getQualityButton() {
        const qualityParent = document.querySelector('div[data-e2e="quality-selector"]');
        if (qualityParent) {
            const divElements = qualityParent.childNodes;
            for (const divNode of divElements) {
                if (divNode.textContent.trim() === '原画') {
                    return divNode;
                }
            }
        }
        return null;
    }

    /** @type {RegExp} */
    const regex = /^\/\d+/;
    if (regex.test(window.location.pathname)) {
        /** @type {number} 计数器，防止检测不到元素一直循环 */
        let counter = 0;
        const timerTheater = setInterval(() => {
            const theaterButton = getTheaterButton();
            if (theaterButton) {
                theaterButton.click();
                clearInterval(timerTheater);
                counter = 0;
                const timerQuality = setInterval(() => {
                    const qualityButton = getQualityButton();
                    if (qualityButton) {
                        qualityButton.click();
                        clearInterval(timerQuality);
                    } else {
                        if (counter++ > 20) {
                            clearInterval(timerQuality);
                        }
                    }
                }, 300);
            } else {
                if (counter++ > 20) {
                    clearInterval(timerTheater);
                }
            }
        }, 300);
    }
})();

