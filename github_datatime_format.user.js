// ==UserScript==
// @name         Github 显示 24 小时时间格式
// @namespace    http://tampermonkey.net/
// @version      1.6.0
// @description  使用北京时间 24 小时格式显示时间
// @icon         https://github.com/fluidicon.png
// @author       guyuexuan
// @license      MIT
// @updateURL    https://mirror.ghproxy.com/https://raw.githubusercontent.com/FanchangWang/tampermonkey_script/main/github_datatime_format.user.js
// @downloadURL  https://mirror.ghproxy.com/https://raw.githubusercontent.com/FanchangWang/tampermonkey_script/main/github_datatime_format.user.js
// @match        https://github.com/*
// @run-at       document-idle
// ==/UserScript==

(function () {
    'use strict';

    let flag = 0;

    /**
     * 格式化日期时间
     * 
     * @param {string} datetimeString 
     * @returns 
     */
    function formatDateTime(datetimeString) {
        const dateTime = new Date(datetimeString);
        const now = new Date();
        const dayDiff = (now - dateTime) / (1000 * 3600 * 24);
        const hour = dateTime.getHours().toString().padStart(2, "0");
        const minute = dateTime.getMinutes().toString().padStart(2, "0");
        const second = dateTime.getSeconds().toString().padStart(2, "0");
        const year = dateTime.getFullYear();
        const month = (dateTime.getMonth() + 1).toString().padStart(2, "0");
        const day = dateTime.getDate().toString().padStart(2, "0");
        if (dayDiff < 1 && now.getDate() === dateTime.getDate()) {
            return `今天 ${hour}:${minute}:${second}`;
        } else if (dayDiff < 2 && now.getDate() - dateTime.getDate() === 1) {
            return `昨天 ${hour}:${minute}:${second}`;
        } else if (year === now.getFullYear()) {
            return `${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")} ${hour}:${minute}:${second}`;
        } else {
            return `${year}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")} ${hour}:${minute}:${second}`;
        }
    }

    /**
     * 遍历 relative-time 元素并修改显示时间格式
     */
    const applyDateTimeFormat = () => {
        if (flag == 0) {
            flag = 1;
            setTimeout(() => {
                document.querySelectorAll(`relative-time`).forEach((item) => {
                    item.shadowRoot.textContent = formatDateTime(item.datetime.toString())
                });
                document.querySelectorAll('h3[data-testid="commit-group-title"]').forEach((item) => {
                    if (item.textContent.includes('Commits on ')) {
                        item.textContent = '提交时间 ' + formatDateTime(item.textContent.replace('Commits on ', ''))
                    }
                })
                flag = 0;
            }, 1000)
        }
    }

    applyDateTimeFormat();

    // 监听 Github 页面的主体区域，动态添加的评论等内容会在这里
    const observer = new MutationObserver((mutations) => {
        applyDateTimeFormat();
    });
    observer.observe(document, {
        childList: true,
        subtree: true
    });
})();
