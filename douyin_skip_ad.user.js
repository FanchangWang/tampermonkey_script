// ==UserScript==
// @name         跳过抖音广告
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @description  使用北京时间 24 小时格式显示时间
// @icon         https://p-pc-weboff.byteimg.com/tos-cn-i-9r5gewecjs/favicon.png
// @author       guyuexuan
// @updateURL    https://mirror.ghproxy.com/https://raw.githubusercontent.com/FanchangWang/tampermonkey_script/main/douyin_skip_ad.user.js
// @downloadURL  https://mirror.ghproxy.com/https://raw.githubusercontent.com/FanchangWang/tampermonkey_script/main/douyin_skip_ad.user.js
// @match        *://www.douyin.com/*
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    const skipAd = true; // 跳过广告（包含普通视频广告以及视频广告）
    const skipLive = false; // 跳过直播

    var toastElement; // 全局变量，用于保存提示框元素

    // 显示提示框并三秒后隐藏
    function showToast(message) {
        // 如果提示框不存在，则创建新的提示框元素
        if (!toastElement) {
            toastElement = document.createElement('div');
            toastElement.style.position = 'fixed';
            toastElement.style.top = '80%'; // 设置垂直位置为屏幕的80%
            toastElement.style.left = '50%'; // 设置水平位置为屏幕的中心
            toastElement.style.transform = 'translateX(-50%)'; // 将提示框水平居中
            toastElement.style.padding = '10px';
            toastElement.style.background = '#333';
            toastElement.style.color = '#fff';
            toastElement.style.borderRadius = '5px';
            toastElement.style.zIndex = '9999';
            document.body.appendChild(toastElement); // 将提示框添加到页面中
        }
        toastElement.textContent = message; // 设置提示框文本内容
        toastElement.style.display = 'block'; // 显示提示框
        setTimeout(function () { // 延迟隐藏提示框
            toastElement.style.display = 'none';
        }, 1000);
    }

    // 检查是否是广告
    function checkAd(element) {
        var spanElements = element.querySelectorAll('span');
        return Array.from(spanElements).some(function (spanElement) {
            return spanElement.textContent.trim() === '广告';
        });
    }

    // 执行跳过操作
    const skip = () => {
        let conElement;
        // 判断当前页面是否是普通视频页面
        conElement = document.querySelector('div.dySwiperSlide div[data-e2e="feed-active-video"] div.video-info-detail div[data-e2e="video-desc"]');
        if (!conElement) {
            // 判断当前页面是否是直播页面
            conElement = document.querySelector('div.dySwiperSlide div[data-e2e="feed-live"]');
            if (skipLive && conElement) {
                document.querySelector('div.xgplayer-playswitch-next').click();
                showToast("脚本提示：自动跳过直播~");
            }
        }
        if (conElement && checkAd(conElement)) {
            document.querySelector('div.xgplayer-playswitch-next').click();
            showToast("脚本提示：自动跳过广告~");
        }
    }

    // 监听页面的主体区域，页面 dom 变化后执行一次
    const observer = new MutationObserver((mutations) => {
        skip();
    });
    observer.observe(document, {
        childList: true,
        subtree: true
    });
})();

