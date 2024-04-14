// ==UserScript==
// @name         跳过抖音广告、直播
// @namespace    http://tampermonkey.net/
// @version      1.2.0
// @description  跳过抖音广告、直播
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

    let configxgIcon = [
        { name: "广告", option: true, type: "ad" },
        { name: "直播", option: false, type: "live" },
    ]
    if (!localStorage.getItem("skip-config")) {
        localStorage.setItem("skip-config", JSON.stringify(configxgIcon))

    } else if (JSON.parse(localStorage.getItem("skip-config")).length != configxgIcon.length) {
        localStorage.setItem("skip-config", JSON.stringify(configxgIcon))
    } else {
        configxgIcon = JSON.parse(localStorage.getItem("skip-config"))
    }

    // 增加 skip 配置
    function addSkipConfigElement() {
        let tHide;
        if (!document.querySelector("[data-e2e='feed-active-video'] [skip-config]")) {
            let config = document.querySelector("[data-e2e='feed-active-video'] .xg-right-grid")
            let xgIcon = document.createElement("xg-icon")
            xgIcon.className = "xgplayer-autoplay-setting automatic-continuous"
            xgIcon.dataset.index = 99
            xgIcon.innerHTML = `
        <div class="xgplayer-icon">
            <div class="xgplayer-setting-label">
                <span class="xg-switch-inner"></span>
                <span class="xgplayer-setting-title" skip-config>配置</span>
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
                    clearTimeout(tHide);
                    xgTips.style.display = "block";
                }
                xgIcon.onmouseleave = () => {
                    tHide = setTimeout(function () {
                        xgTips.style.display = "none";
                    }, 2000);
                }
                xgTips.onclick = (e) => {
                    e.stopPropagation()
                }
                xgTips.appendChild(iconitem)
            }
            config?.appendChild(xgIcon)
        }
    }

    let toastElement; // 全局变量，用于保存提示框元素

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
        }, 1500);
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
        let isLive = false;
        // 判断当前页面是否是普通视频页面
        conElement = document.querySelector('div.dySwiperSlide div[data-e2e="feed-active-video"] div.video-info-detail div[data-e2e="video-desc"]');
        if (!conElement) {
            // 判断当前页面是否是直播页面
            conElement = document.querySelector('div.dySwiperSlide div[data-e2e="feed-live"]');
            isLive = true;
        }
        if (conElement) {
            if (isLive) {
                if (configxgIcon[1].option) {
                    document.querySelector('div.xgplayer-playswitch-next').click();
                    showToast("脚本提示：自动跳过直播~");
                    return;
                }
            } else {
                addSkipConfigElement();
            }
            if (configxgIcon[0].option) {
                if (checkAd(conElement)) {
                    document.querySelector('div.xgplayer-playswitch-next').click();
                    showToast("脚本提示：自动跳过广告~");
                }
            }
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

