// ==UserScript==
// @name         Github 显示 24 小时时间格式
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @description  使用北京时间 24 小时格式显示时间
// @icon         https://github.com/fluidicon.png
// @author       guyuexuan
// @match        *://github.com/*
// @match        *://kgithub.com/*
// @match        *://hub.fgit.ml/*
// @match        *://hub.fgit.gq/*
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    function formatDateTime(datetimeString) {
        const dateTime = new Date(datetimeString);
        const now = new Date();
        const dayDiff = (now.getTime() - dateTime.getTime()) / (1000 * 3600 * 24);
        const hour = dateTime.getHours();
        const minute = dateTime.getMinutes();
        const second = dateTime.getSeconds();
        if (dayDiff < 1 && now.getDate() === dateTime.getDate()) {
            return `今天 ${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}:${second.toString().padStart(2, "0")}`;
        } else if (dayDiff < 2 && now.getDate() - dateTime.getDate() === 1) {
            return `昨天 ${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}:${second.toString().padStart(2, "0")}`;
        } else {
            const year = dateTime.getFullYear();
            const month = dateTime.getMonth() + 1;
            const day = dateTime.getDate();
            const formattedDateTime = `${year}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")} ${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}:${second.toString().padStart(2, "0")}`;
            return formattedDateTime;
        }
    }

    // 修改页面中已有的时间格式
    const applyDateTimeFormat = () => {
        document.querySelectorAll(`relative-time`).forEach((item) => {
            item.shadowRoot.textContent = formatDateTime(item.datetime.toString())
        });
    }
    applyDateTimeFormat();

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
