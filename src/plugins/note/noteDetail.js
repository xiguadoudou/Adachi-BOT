
import db from "../../utils/database.js";
import fetch from "node-fetch";
import { getDS } from "../../utils/ds.js";
import md5 from "md5";
import { randomString } from "../../utils/tools.js";
import { v3 as uuidv3 } from 'uuid';

const __API = {
    FETCH_ROLE_DAILY_NOTE: "https://api-takumi.mihoyo.com/game_record/app/genshin/api/dailyNote",
    REFERER_URL: "https://webstatic.mihoyo.com/bbs/event/signin-ys/index.html?bbs_auth_required=true&act_id=e202009291139501&utm_source=bbs&utm_medium=mys&utm_campaign=icon",
    SIGN_INFO_URL: "https://api-takumi.mihoyo.com/event/bbs_sign_reward/info",
    RESIGN_INFO_URL: "https://api-takumi.mihoyo.com/event/bbs_sign_reward/resign_info",
    SIGN_URL: "https://api-takumi.mihoyo.com/event/bbs_sign_reward/sign",
    REWARD_URL: "https://api-takumi.mihoyo.com/event/bbs_sign_reward/home",
    LEDGER_URL: "https://hk4e-api.mihoyo.com/event/ys_ledger/monthInfo",
};
const HEADERS = {
    "User-Agent":
        "Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) miHoYoBBS/2.11.1",
    Referer: "https://webstatic.mihoyo.com/",
    "x-rpc-app_version": "2.11.1",
    "x-rpc-client_type": 5,
    DS: "",
    Cookie: "",
};

async function getUserCookie(user, bot) {
    if (!(await db.includes("note", "cookie", "user", user))) {
        const initData = { user, cookie: "" };
        await db.push("note", "cookie", initData);
    }
    let { cookie } = await db.get("note", "cookie", { user });
    return cookie;
}

async function setUserCookie(user, userCookie, bot) {
    if (!(await db.includes("note", "cookie", "user", user))) {
        const initData = { user, cookie: "" };
        await db.push("note", "cookie", initData);
    }
    await db.update("note", "cookie", { user }, { cookie: userCookie });
}

function getDailyNote(role_id, server, cookie) {
    const query = { role_id, server };

    return fetch(`${__API.FETCH_ROLE_DAILY_NOTE}?${new URLSearchParams(query)}`, {
        method: "GET",
        qs: query,
        headers: { ...HEADERS, DS: getDS(query), Cookie: cookie },
    }).then((res) => res.json());
}

function getSignInfo(role_id, server, cookie) {
    const query = { region: server, act_id: "e202009291139501", uid: role_id, };

    return fetch(`${__API.SIGN_INFO_URL}?${new URLSearchParams(query)}`, {
        method: "GET",
        qs: query,
        headers: { ...HEADERS, DS: getDS(query), Cookie: cookie, Referer: __API.REFERER_URL },
    }).then((res) => res.json());
}

function getReSignInfo(role_id, server, cookie) {
    const query = { region: server, act_id: "e202009291139501", uid: role_id, };

    return fetch(`${__API.RESIGN_INFO_URL}?${new URLSearchParams(query)}`, {
        method: "GET",
        qs: query,
        headers: { ...HEADERS, DS: getDS(query), Cookie: cookie, Referer: __API.REFERER_URL },
    }).then((res) => res.json());
}

function getRewardsInfo(cookie) {
    const query = { act_id: "e202009291139501", };

    return fetch(`${__API.REWARD_URL}?${new URLSearchParams(query)}`, {
        method: "GET",
        qs: query,
        headers: { ...HEADERS, DS: getDS(query), Cookie: cookie, Referer: __API.REFERER_URL },
    }).then((res) => res.json());
}

function mysSignIn(role_id, server, cookie) {
    const body = { act_id: "e202009291139501", region: server, uid: role_id, };
    const n = "h8w582wxwgqvahcdkpvdhbh2w9casgfl";
    const i = (Date.now() / 1000) | 0;
    const r = randomString(6);
    const c = md5(`salt=${n}&t=${i}&r=${r}`);

    return fetch(__API.SIGN_URL, {
        method: "POST",
        json: true,
        body: JSON.stringify(body),
        headers: {
            ...HEADERS,
            DS: `${i},${r},${c}`,
            Cookie: cookie,
            Referer: __API.REFERER_URL,
            "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) miHoYoBBS/2.3.0",
            "x-rpc-app_version": "2.3.0",
            "x-rpc-client_type": 5,
            "x-rpc-device_id": uuidv3(cookie, uuidv3.URL).replace("-", ""),
        },
    }).then((res) => res.json());
}

function getLedger(bind_uid, bind_region, cookie, month = 0) {
    const query = { month: month, bind_uid: bind_uid, bind_region: bind_region, bbs_presentation_style: "fullscreen", bbs_auth_required: true, mys_source: "GameRecord" };

    return fetch(`${__API.LEDGER_URL}?${new URLSearchParams(query)}`, {
        method: "GET",
        qs: query,
        headers: { ...HEADERS, DS: getDS(query), Cookie: cookie, Referer: "https://webstatic.mihoyo.com/ys/event/e20200709ysjournal/index.html?bbs_presentation_style=fullscreen&bbs_auth_required=true&mys_source=GameRecord" },
    }).then((res) => res.json());
}

async function notePromise(uid, server, userID, bot) {
    //await userInitialize(userID, uid, "", -1);
    //db.update("character", "user", { userID }, { uid });

    const nowTime = new Date().valueOf();
    //const { time: lastTime } = db.get("time", "user", { note: uid }) || {};
    const { data: dbData,time:lastTime } = db.get("note", "user", { uid }) || {};

    // 尝试使用缓存
    if (dbData) {
        if (
            lastTime &&
            nowTime - lastTime < config.cacheAbyEffectTime * 16 * 60 * 1000
        ) {
            bot.logger.debug(
                `缓存：使用 ${uid} 在 ${config.cacheAbyEffectTime} 小时内的实时便笺。`
            );
            return [lastTime, dbData];
        }
    }

    const cookie = await getUserCookie(uid, bot);
    if (!cookie)
        return Promise.reject(`未设置私人cookie`);

    const { retcode, message, data } = await getDailyNote(
        uid,
        server,
        cookie
    );

    if (retcode !== 0) {
        return Promise.reject(`米游社接口报错: ${message}`);
    }

    if (!db.includes("note", "user", "uid", uid)) {
        const initData = { uid, data: [] };
        db.push("note", "user", initData);
    }

    db.update("note", "user", { uid }, { data, time: nowTime });
    //db.update("time", "user", { note: uid }, { time: nowTime });
    //bot.logger.debug(
    //    `缓存：新增 ${uid} 的实时便笺，缓存 ${config.cacheAbyEffectTime} 小时。`
    //);
    return [nowTime, data];
}


async function signInfoPromise(uid, server, userID, bot) {
    const cookie = await getUserCookie(uid, bot);
    if (!cookie)
        return Promise.reject(`未设置私人cookie`);
    bot.logger.debug(
        `signInfo ${uid} ${server} ${cookie}`
    );
    const { retcode, message, data } = await getSignInfo(
        uid,
        server,
        cookie
    );

    if (retcode !== 0) {
        return Promise.reject(`米游社接口报错: ${message}`);
    }

    return data;
}

async function resignInfoPromise(uid, server, userID, bot) {
    const cookie = await getUserCookie(uid, bot);
    if (!cookie)
        return Promise.reject(`未设置私人cookie`);
    bot.logger.debug(
        `signInfo ${uid} ${server} ${cookie}`
    );
    const { retcode, message, data } = await getReSignInfo(
        uid,
        server,
        cookie
    );

    if (retcode !== 0) {
        return Promise.reject(`米游社接口报错: ${message}`);
    }

    return data;
}

async function rewardsPromise(uid, server, userID, bot) {
    const cookie = await getUserCookie(uid, bot);
    if (!cookie)
        return Promise.reject(`未设置私人cookie`);
    bot.logger.debug(
        `rewards ${uid} ${server} ${cookie}`
    );
    const { retcode, message, data } = await getRewardsInfo(
        cookie
    );

    if (retcode !== 0) {
        return Promise.reject(`米游社接口报错: ${message}`);
    }

    return data;
}

async function signInPromise(uid, server, userID, bot) {
    const cookie = await getUserCookie(uid, bot);
    if (!cookie)
        return Promise.reject(`未设置私人cookie`);
    bot.logger.debug(
        `signIn ${uid} ${server} ${cookie}`
    );
    const { retcode, message, data } = await mysSignIn(
        uid,
        server,
        cookie
    );

    if (retcode !== 0) {
        return Promise.reject(`米游社接口报错: ${message}`);
    }

    return data;
}

async function ledgerPromise(uid, server, userID, bot, month = 0) {
    const cookie = await getUserCookie(uid, bot);
    if (!cookie)
        return Promise.reject(`未设置私人cookie`);
    bot.logger.debug(
        `ledger ${uid} ${server} ${cookie}`
    );
    const { retcode, message, data } = await getLedger(
        uid,
        server,
        cookie,
        month
    );

    if (retcode !== 0) {
        return Promise.reject(`米游社接口报错: ${message}`);
    }

    return data;
}

export { notePromise, signInfoPromise, resignInfoPromise, rewardsPromise, signInPromise, ledgerPromise, setUserCookie };