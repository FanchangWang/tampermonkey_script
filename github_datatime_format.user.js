// ==UserScript==
// @name         Github 显示 24 小时时间格式
// @namespace    http://tampermonkey.net/
// @version      1.3.0
// @description  使用北京时间 24 小时格式显示时间
// @icon         https://github.com/fluidicon.png
// @author       guyuexuan
// @updateURL    https://mirror.ghproxy.com/https://raw.githubusercontent.com/FanchangWang/tampermonkey_script/main/github_datatime_format.user.js
// @downloadURL  https://mirror.ghproxy.com/https://raw.githubusercontent.com/FanchangWang/tampermonkey_script/main/github_datatime_format.user.js
// @match        *://github.com/*
// @match        *://kgithub.com/*
// @match        *://hub.fgit.ml/*
// @match        *://hub.fgit.gq/*
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(function () {
    'use strict';
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

    // 修改页面中已有的时间格式
    const applyDateTimeFormat = () => {
        document.querySelectorAll(`relative-time`).forEach((item) => {
            item.shadowRoot.textContent = formatDateTime(item.datetime.toString())
        });
    }

    // 监听 Github 页面的主体区域，动态添加的评论等内容会在这里
    const observer = new MutationObserver((mutations) => {
        setTimeout(() => {
            applyDateTimeFormat();
        }, 1000)
    });
    observer.observe(document, {
        childList: true,
        subtree: true
    });
})();
