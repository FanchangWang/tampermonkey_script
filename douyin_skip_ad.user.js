// ==UserScript==
// @name         跳过抖音广告
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @description  使用北京时间 24 小时格式显示时间
// @icon         https://p-pc-weboff.byteimg.com/tos-cn-i-9r5gewecjs/favicon.png
// @author       guyuexuan
// @updateURL    https://ghproxy.com/https://raw.githubusercontent.com/FanchangWang/tampermonkey_script/main/douyin_skip_ad.user.js
// @downloadURL  https://ghproxy.com/https://raw.githubusercontent.com/FanchangWang/tampermonkey_script/main/douyin_skip_ad.user.js
// @match        *://www.douyin.com/*
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    const skipAd = true; // 跳过广告（包含普通视频广告以及视频广告）
    const skipLive = false; // 跳过直播

    // 检查是否是广告
    function checkAd(element) {
        var spanElements = element.querySelectorAll('span');
        spanElements.forEach(function (spanElement) {
            if (spanElement.textContent.trim() === '广告') {
                return true;
            }
        });
        return false;
    }

    // 执行跳过操作
    const skip = () => {
        // 判断当前页面是否是普通视频页面
        conElement = document.querySelector('div.dySwiperSlide div[data-e2e="feed-active-video"] div.video-info-detail div[data-e2e="video-desc"]');
        if (!conElement) {
            // 判断当前页面是否是直播页面
            conElement = document.querySelector('div.dySwiperSlide div[data-e2e="feed-live"]');
            if (skipLive && conElement) {
                document.querySelector('div.xgplayer-playswitch-next').click();
            }
        }
        if (conElement) {
            if (checkAd(conElement)) {
                document.querySelector('div.xgplayer-playswitch-next').click();
            }
        }
    }

    skip();

    // 监听页面的主体区域，页面 dom 变化后执行一次
    const observer = new MutationObserver((mutations) => {
        setTimeout(() => {
            skip();
        }, 1000)
    });
    observer.observe(document, {
        childList: true,
        subtree: true
    });
})();
