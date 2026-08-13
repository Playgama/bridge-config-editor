/* eslint-disable */
// Human-readable help text for Playgama Bridge config fields (SDK v2).
// Keys are dot-paths matching the structure used by app.js.
// Each entry: { text, link? } — keep text to 1–2 short sentences.
window.FIELD_DESCRIPTIONS = {
    // ----- General -----
    'debug': {
        text: 'Enable SDK debug logging in the browser console. Default: false.',
    },
    'sendAnalyticsEvents': {
        text: 'When enabled, the SDK reports gameplay events to Playgama analytics. Default: true.',
    },
    'forciblySetPlatformId': {
        text: 'Override the auto-detected platform id. Use it on platforms where auto-detection does not work, or when you need to explicitly tell the bridge which platform to connect.',
    },
    'disableLoadingLogo': {
        text: 'Hide the Playgama loading logo shown before the game starts. Default: false.',
    },
    'showFullLoadingLogo': {
        text: 'Show the full Playgama logo during loading instead of the compact version. Ignored on Yandex and Y8. Default: false.',
    },
    'showLoadingText': {
        text: 'Show a loading text line on the loading screen. Always enabled on Xiaomi. Default: false.',
    },
    'remoteConfigUrl': {
        text: 'URL of a remotely hosted bridge config. When set, the SDK fetches it on start and it replaces the local config (except forciblySetPlatformId and remoteConfigUrl).',
    },
    'remoteConfigTimeout': {
        text: 'Timeout in milliseconds for the remote config fetch. On timeout the cached or local config is used. Default: 2000.',
    },
    'remoteConfigTtl': {
        text: 'How long in milliseconds the fetched remote config is cached in localStorage. Default: 3600000 (1 hour).',
    },
    'game.adaptToSafeArea': {
        text: 'Automatically adapt the game canvas to the device safe area (notches, rounded corners). Default: false.',
    },

    // ----- Device -----
    'device.useBuiltInOrientationPopup': {
        text: 'Show the built-in popup that asks the player to rotate the device when the current orientation is not supported. Shown only when exactly one orientation is supported, on mobile/tablet. Default: false.',
    },
    'device.supportedOrientations': {
        text: 'Orientations the game supports. Allowed values: "landscape", "portrait". If empty, both are accepted.',
    },

    // ----- Platforms (section-level) -----
    'platforms': {
        text: 'Platform-specific settings. Any root config section (advertisement, crossPromo, device, ...) can also be placed inside a platform section to override it for that platform only.',
    },
    'platforms.overrides': {
        text: 'Root config sections overridden for this platform only, as JSON. They are deep-merged over the root config once the platform is detected, e.g. { "advertisement": { "banner": { "disable": true } } }.',
    },
    'platforms.game_distribution': {
        text: 'Settings for the GameDistribution platform.',
    },
    'platforms.telegram': {
        text: 'Settings for the Telegram (Mini Apps) platform.',
    },
    'platforms.y8': {
        text: 'Settings for the Y8 platform.',
    },
    'platforms.lagged': {
        text: 'Settings for the Lagged platform.',
    },
    'platforms.huawei': {
        text: 'Settings for the Huawei Quick Game platform.',
    },
    'platforms.msn': {
        text: 'Settings for the MSN Games platform.',
    },
    'platforms.discord': {
        text: 'Settings for the Discord Activities platform.',
    },
    'platforms.gamepush': {
        text: 'Settings for the GamePush platform.',
    },
    'platforms.jio_games': {
        text: 'Settings for the JioGames platform.',
    },
    'platforms.crazy_games': {
        text: 'Settings for the CrazyGames platform.',
    },
    'platforms.facebook': {
        text: 'Settings for the Facebook Instant Games platform.',
    },
    'platforms.yandex': {
        text: 'Settings for the Yandex Games platform.',
    },
    'platforms.xiaomi': {
        text: 'Settings for the Xiaomi (mibrowser) platform.',
    },
    'platforms.dlightek': {
        text: 'Settings for the DLightek platform.',
    },
    'platforms.microsoft_store': {
        text: 'Settings for games distributed via the Microsoft Store.',
    },
    'platforms.samsung': {
        text: 'Settings for the Samsung Instant Plays platform.',
    },
    'platforms.tiktok': {
        text: 'Settings for the TikTok platform.',
    },

    // ----- Platforms.game_distribution -----
    'platforms.game_distribution.gameId': {
        text: 'Required. GameDistribution game id. Get it from your GameDistribution developer dashboard.',
    },

    // ----- Platforms.telegram -----
    'platforms.telegram.adsgramBlockId': {
        text: 'Adsgram block id used to monetize the Telegram Mini App. Get it from the Adsgram dashboard at https://adsgram.ai.',
    },

    // ----- Platforms.y8 -----
    'platforms.y8.gameId': {
        text: 'Required. Y8 game id. Get it from your Y8 developer account.',
    },
    'platforms.y8.adsenseId': {
        text: 'Google AdSense publisher id used for Y8 ads. Get it from your Google AdSense account.',
    },
    'platforms.y8.channelId': {
        text: 'AdSense ad channel id for Y8 ad requests. Get it from your Google AdSense account.',
    },

    // ----- Platforms.lagged -----
    'platforms.lagged.devId': {
        text: 'Required. Lagged developer id. Get it from your Lagged developer account.',
    },
    'platforms.lagged.publisherId': {
        text: 'Required. Lagged publisher id. Get it from your Lagged developer account.',
    },

    // ----- Platforms.huawei -----
    'platforms.huawei.appId': {
        text: 'Required. Huawei Quick Game app id. Get it from the Huawei AppGallery Connect console.',
    },

    // ----- Platforms.msn -----
    'platforms.msn.gameId': {
        text: 'Required. MSN Games game id, used for storage, payments and advertisement. Get it from your MSN Games partner contact.',
    },

    // ----- Platforms.discord -----
    'platforms.discord.appId': {
        text: 'Required. Discord application id. Get it from the Discord Developer Portal at https://discord.com/developers/applications.',
    },

    // ----- Platforms.gamepush -----
    'platforms.gamepush.projectId': {
        text: 'Required. GamePush project id. Get it from your GamePush dashboard at https://gamepush.com.',
    },
    'platforms.gamepush.publicToken': {
        text: 'Required. GamePush public token. Get it from your GamePush project settings.',
    },

    // ----- Platforms.jio_games -----
    'platforms.jio_games.adTestMode': {
        text: 'Enable JioGames ad test mode so test ads are served instead of real ones. Disable for production.',
    },

    // ----- Platforms.crazy_games -----
    'platforms.crazy_games.xsollaProjectId': {
        text: 'Xsolla project id used for CrazyGames in-game purchases. Payments are unavailable without it. Get it from your Xsolla publisher account.',
    },
    'platforms.crazy_games.isSandbox': {
        text: 'Use the CrazyGames sandbox environment for testing. Default: false.',
    },
    'platforms.crazy_games.useUserToken': {
        text: 'Fetch the CrazyGames user auth token (JWT) so you can verify the player on your backend. Default: false.',
    },

    // ----- Platforms.facebook -----
    'platforms.facebook.subscribeForNotificationsOnStart': {
        text: 'Automatically prompt the player to subscribe to Facebook bot notifications on game start. Default: false.',
    },

    // ----- Platforms.yandex -----
    'platforms.yandex.useSignedData': {
        text: 'Request cryptographically signed user data from Yandex so you can verify identity and purchases on your server. Default: false.',
    },

    // ----- Platforms.xiaomi -----
    'platforms.xiaomi.adSenseId': {
        text: 'Required. Google AdSense publisher id used for Xiaomi mibrowser ads. Get it from your Google AdSense account.',
    },
    'platforms.xiaomi.testMode': {
        text: 'Enable AdSense test mode so test ads are served instead of real ones. Disable for production.',
    },

    // ----- Platforms.dlightek -----
    'platforms.dlightek.appKey': {
        text: 'Required. DLightek application key. Get it from your DLightek partner contact.',
    },
    'platforms.dlightek.adSenseId': {
        text: 'Required. Google AdSense publisher id used for DLightek ads. Get it from your Google AdSense account.',
    },
    'platforms.dlightek.adChannel': {
        text: 'AdSense ad channel id used for DLightek ad requests. Get it from your Google AdSense account.',
    },
    'platforms.dlightek.testMode': {
        text: 'Enable DLightek test mode so test ads are served instead of real ones. Disable for production.',
    },

    // ----- Platforms.microsoft_store -----
    'platforms.microsoft_store.gameId': {
        text: 'Required. Microsoft Store game id assigned to your title. Get it from Microsoft Partner Center.',
    },
    'platforms.microsoft_store.playgamaAdsId': {
        text: 'Required. Playgama ads id used to monetize the Microsoft Store build. Get it from your Playgama manager.',
    },

    // ----- Platforms.samsung -----
    'platforms.samsung.admobInterstitialAdUnitId': {
        text: 'AdMob ad unit id used for interstitial ads on Samsung Instant Plays. Get it from your Google AdMob console.',
    },
    'platforms.samsung.admobRewardedAdUnitId': {
        text: 'AdMob ad unit id used for rewarded ads on Samsung Instant Plays. Get it from your Google AdMob console.',
    },
    'platforms.samsung.gameTitle': {
        text: 'Game title shown by Samsung Instant Plays. Use the same title you registered in the Samsung Galaxy Store.',
    },

    // ----- Platforms.tiktok -----
    'platforms.tiktok.clientKey': {
        text: 'TikTok client key for the integrated app. Get it from the TikTok Developers portal at https://developers.tiktok.com.',
    },

    // ----- Advertisement (section + common fields) -----
    'advertisement': {
        text: 'Cross-platform ad configuration. Define ad units (interstitial, rewarded, banner, advanced banners) and per-platform placement ids.',
    },
    'advertisement.useBuiltInErrorPopup': {
        text: 'Show the built-in info popup when an ad is closed too early or fails. Default: false.',
    },
    'advertisement.useAdvertisementErrorPopup': {
        text: 'Show the ad-failure popup when an ad fails to display. When not set, the platform default is used.',
    },
    'advertisement.builtInErrorPopupCooldown': {
        text: 'Cooldown in seconds between built-in interstitial failure popups. Default: 180.',
    },
    'advertisement.minimumDelayBetweenInterstitial': {
        text: 'Minimum delay in seconds between two interstitial ads. Default: 60.',
    },
    'advertisement.initialInterstitialDelay': {
        text: 'Delay in seconds before the first interstitial ad can be shown after the game starts. Leave empty to use the platform default: 60 s on most platforms, 30 s on Xiaomi, 180 s on Y8.',
    },
    'advertisement.interstitial': {
        text: 'Interstitial ad unit configuration: placements and per-platform overrides.',
    },
    'advertisement.rewarded': {
        text: 'Rewarded ad unit configuration: placements and per-platform overrides.',
    },
    'advertisement.banner': {
        text: 'Banner ad unit configuration: placements and per-platform overrides.',
    },
    'advertisement.advancedBanners': {
        text: 'Advanced banners: sets of banner containers shown for a placement, picked by device and screen conditions. Supported on CrazyGames, MSN, Playgama and Standalone.',
    },

    // ----- Per-ad-unit fields -----
    'advertisement.interstitial.preloadOnStart': {
        text: 'Placement id of the interstitial to preload right after SDK initialization so it is ready to display sooner.',
    },
    'advertisement.interstitial.placementFallback': {
        text: 'Placement id used when the requested placement is not available. Must match one of the placements[].id values.',
    },
    'advertisement.interstitial.placements': {
        text: 'List of interstitial placements with their per-platform ad ids.',
    },
    'advertisement.interstitial.disable': {
        text: 'Disable interstitial ads entirely.',
    },
    'advertisement.interstitial.autoShow': {
        text: 'SDK events that automatically request an interstitial, with the event name used as the placement id. Platform messages fire on sendMessage(), "storage_set" on every storage write, "visibility_state_visible" when the game returns to the foreground.',
    },

    'advertisement.rewarded.preloadOnStart': {
        text: 'Placement id of the rewarded ad to preload right after SDK initialization so it is ready to display sooner.',
    },
    'advertisement.rewarded.placementFallback': {
        text: 'Placement id used when the requested placement is not available. Must match one of the placements[].id values.',
    },
    'advertisement.rewarded.placements': {
        text: 'List of rewarded placements with their per-platform ad ids.',
    },
    'advertisement.rewarded.disable': {
        text: 'Disable rewarded ads entirely.',
    },

    'advertisement.banner.placementFallback': {
        text: 'Placement id used when the requested placement is not available. Must match one of the placements[].id values.',
    },
    'advertisement.banner.placements': {
        text: 'List of banner placements with their per-platform ad ids.',
    },
    'advertisement.banner.disable': {
        text: 'Disable banner ads entirely.',
    },

    'advertisement.advancedBanners.placementFallback': {
        text: 'Placement name used when advanced banners are requested without one.',
    },
    'advertisement.advancedBanners.disable': {
        text: 'Disable advanced banners entirely.',
    },
    'advertisement.advancedBanners.placements': {
        text: 'Placements that trigger advanced banners. A placement fires when the game calls showAdvancedBanners() with its name, or when a platform message of that name is sent.',
    },
    'advertisement.advancedBanners.placementName': {
        text: 'Name used to trigger this placement, e.g. a platform message like "gameplay_started" or any name you pass to showAdvancedBanners().',
    },
    'advertisement.advancedBanners.action': {
        text: '"Show" displays the banners matching the current conditions, "Hide" removes the banners currently on screen.',
    },
    'advertisement.advancedBanners.condition': {
        text: 'Conditions are segments joined by ":" — device type (desktop, mobile, tablet, tv), orientation (portrait, landscape), size (w>800, h<=600), aspect ratio (ar>1.5) and "canvas" to measure the game canvas instead of the window. The best-matching condition wins; "default" is used when none match.',
    },
    'advertisement.advancedBanners.banner': {
        text: 'Position and size of one banner container, always as a percentage of the screen so banners scale with it. Empty fields are left to the browser.',
    },

    // ----- Ad placement -----
    'adPlacement.id': {
        text: 'Required. Your placement identifier used in code when requesting this ad slot.',
    },
    'adPlacement.facebook': {
        text: 'Facebook Instant Games ad placement id. Get it from the Facebook Developer dashboard.',
    },
    'adPlacement.yandex': {
        text: 'Yandex Games ad placement id. Get it from the Yandex Games developer console.',
    },
    'adPlacement.game_distribution': {
        text: 'GameDistribution ad placement id. Get it from your GameDistribution dashboard.',
    },
    'adPlacement.telegram': {
        text: 'Telegram (Adsgram) ad placement id. Get it from the Adsgram dashboard.',
    },
    'adPlacement.y8': {
        text: 'Y8 ad placement id. Get it from your Y8 developer account.',
    },
    'adPlacement.lagged': {
        text: 'Lagged ad placement id. Get it from your Lagged developer account.',
    },
    'adPlacement.huawei': {
        text: 'Huawei Quick Game ad placement id. Get it from Huawei AppGallery Connect.',
    },
    'adPlacement.msn': {
        text: 'MSN Games ad placement id. Get it from your MSN Games partner contact.',
    },
    'adPlacement.discord': {
        text: 'Discord ad placement id. Get it from your Discord ads partner contact.',
    },
    'adPlacement.gamepush': {
        text: 'GamePush ad placement id. Get it from your GamePush project settings.',
    },
    'adPlacement.jio_games': {
        text: 'JioGames ad placement id. Get it from your JioGames developer account.',
    },
    'adPlacement.crazy_games': {
        text: 'CrazyGames ad placement id. Get it from your CrazyGames developer portal.',
    },
    'adPlacement.youtube': {
        text: 'YouTube Playables ad placement id. Get it from your YouTube partner contact.',
    },
    'adPlacement.vk': {
        text: 'VK Play ad placement id. Get it from your VK Play developer console.',
    },
    'adPlacement.ok': {
        text: 'OK Games ad placement id. Get it from your OK developer console.',
    },
    'adPlacement.playgama': {
        text: 'Playgama ad placement id. Get it from your Playgama manager.',
    },
    'adPlacement.poki': {
        text: 'Poki ad placement id. Get it from the Poki for Developers dashboard.',
    },
    'adPlacement.mock': {
        text: 'Mock platform ad placement id used for local development and testing.',
    },
    'adPlacement.qa_tool': {
        text: 'Playgama QA tool ad placement id used for internal testing.',
    },
    'adPlacement.standalone': {
        text: 'Standalone build ad placement id.',
    },
    'adPlacement.portal': {
        text: 'White-label portal ad placement id. Get it from your portal operator.',
    },
    'adPlacement.reddit': {
        text: 'Reddit Games ad placement id. Get it from your Reddit Games partner contact.',
    },
    'adPlacement.dlightek': {
        text: 'DLightek ad placement id. Get it from your DLightek partner contact.',
    },
    'adPlacement.gamesnacks': {
        text: 'GameSnacks ad placement id. Get it from your GameSnacks developer console.',
    },
    'adPlacement.microsoft_store': {
        text: 'Microsoft Store ad placement id. Get it from your Microsoft Partner Center setup.',
    },
    'adPlacement.samsung': {
        text: 'Samsung Instant Plays ad placement id, typically the AdMob ad unit id from the Google AdMob console.',
    },
    'adPlacement.tiktok': {
        text: 'TikTok ad placement id. Get it from the TikTok Developers portal.',
    },
    'adPlacement.xiaomi': {
        text: 'Xiaomi (mibrowser) ad placement id. Get it from your Google AdSense setup.',
    },

    // ----- Cross-promo -----
    'crossPromo': {
        text: 'Cross-promotion block: a list of your other games shown to the player. Games come from the static list below or from the platform SDK catalog.',
    },
    'crossPromo.title': {
        text: 'Title shown above the cross-promo games list. Default: "More games".',
    },
    'crossPromo.source': {
        text: 'Where the games list comes from: "config" uses the static games list below, "platform" uses the platform SDK catalog. Default: config.',
    },
    'crossPromo.games': {
        text: 'Static list of promoted games. Each game needs a URL; name and icon are optional.',
    },
    'crossPromo.games.url': {
        text: 'Required. Link the player is sent to when clicking the game.',
    },
    'crossPromo.games.name': {
        text: 'Game name shown under the icon.',
    },
    'crossPromo.games.icon': {
        text: 'Icon URL or a path relative to the game build (e.g. cross-promo/my-game.png).',
    },

    // ----- Daily rewards -----
    'dailyRewards': {
        text: 'Daily rewards calendar. The SDK tracks claim days on server time; the game decides what each reward id grants.',
    },
    'dailyRewards.rewards': {
        text: 'Required. Ordered list of reward ids, one per day. The player claims them in order.',
    },
    'dailyRewards.cycle': {
        text: 'Restart the calendar from day one after the last reward is claimed. Default: true.',
    },
    'dailyRewards.resetOnMiss': {
        text: 'Reset progress to day one when the player misses a day. Default: true.',
    },

    // ----- Tasks -----
    'tasks': {
        text: 'Task (quest) groups. Each group has a period type; a task completes when all of its targets reach their amount.',
    },
    'tasks.id': {
        text: 'Required. Stable storage key of the group. Do not change it after release or player progress will reset.',
    },
    'tasks.type': {
        text: 'Required. Task period: "daily" and "weekly" tasks reset each period, "permanent" tasks never reset.',
    },
    'tasks.items': {
        text: 'Tasks in this group. Every task is active for the whole period.',
    },
    'tasks.items.id': {
        text: 'Required. Task identifier returned by the tasks API.',
    },
    'tasks.items.targets': {
        text: 'Objectives of the task. The id is the gameplay metric the game reports via addProgress(); amount is the value that completes it.',
    },
    'tasks.items.rewards': {
        text: 'Rewards granted when the task completes. Data-only: the game decides what each id/amount means.',
    },

    // ----- Achievements -----
    'achievements': {
        text: 'Game achievements. On platforms without native achievements the SDK manages a local fallback using id, name and description.',
    },
    'achievements.id': {
        text: 'Required. The game-level achievement id you pass to the achievements API.',
    },
    'achievements.name': {
        text: 'Achievement name used by the SDK-managed local fallback on platforms without native achievements.',
    },
    'achievements.description': {
        text: 'Achievement description used by the SDK-managed local fallback.',
    },
    'achievements.y8': {
        text: 'Y8 native achievement mapping. Both values come from your Y8 developer account.',
    },
    'achievements.y8.achievement': {
        text: 'Required. Y8 achievement name exactly as registered on Y8.',
    },
    'achievements.y8.achievementkey': {
        text: 'Required. Y8 achievement key from your Y8 developer account.',
    },
    'achievements.lagged': {
        text: 'Lagged native achievement mapping.',
    },
    'achievements.lagged.id': {
        text: 'Required. Lagged achievement id from your Lagged developer account.',
    },

    // ----- Payments (section + items) -----
    'payments': {
        text: 'List of in-game products. Each item has a Bridge product id and optional per-platform overrides.',
    },
    'payments.id': {
        text: 'Required. Bridge product id you pass to the purchase API. Many platforms reuse this id when no override is provided.',
    },
    'payments.crazy_games': {
        text: 'Per-product CrazyGames override. Configure when the Xsolla SKU differs from the Bridge id.',
    },
    'payments.crazy_games.id': {
        text: 'Required. Xsolla SKU of the product. Get it from your Xsolla publisher account.',
    },
    'payments.discord': {
        text: 'Per-product Discord override. Configure when the Discord SKU id differs from the Bridge id.',
    },
    'payments.discord.id': {
        text: 'Required. Discord SKU id for the product. Get it from the Discord Developer Portal under your application monetization settings.',
    },
    'payments.facebook': {
        text: 'Per-product Facebook override. Configure when the Facebook product id differs from the Bridge id.',
    },
    'payments.facebook.id': {
        text: 'Required. Facebook product id. Get it from the Facebook Developer dashboard under in-app purchases.',
    },
    'payments.huawei': {
        text: 'Per-product Huawei override. Configure when the Huawei product id differs from the Bridge id.',
    },
    'payments.huawei.id': {
        text: 'Required. Huawei product id. Get it from Huawei AppGallery Connect under in-app purchases.',
    },
    'payments.microsoft_store': {
        text: 'Per-product Microsoft Store override. Configure when the store product id differs from the Bridge id.',
    },
    'payments.microsoft_store.id': {
        text: 'Required. Microsoft Store product id. Get it from Microsoft Partner Center.',
    },
    'payments.msn': {
        text: 'Per-product MSN Games override. Configure when the MSN product id differs from the Bridge id.',
    },
    'payments.msn.id': {
        text: 'Required. MSN Games product id. Get it from your MSN Games partner contact.',
    },
    'payments.portal': {
        text: 'Per-product white-label portal override. Configure when the portal product id differs from the Bridge id.',
    },
    'payments.portal.id': {
        text: 'Required. Portal product id. Get it from your portal operator.',
    },
    'payments.reddit': {
        text: 'Per-product Reddit Games override. Configure when the Reddit product id differs from the Bridge id.',
    },
    'payments.reddit.id': {
        text: 'Required. Reddit product id. Get it from your Reddit Games partner contact.',
    },
    'payments.yandex': {
        text: 'Per-product Yandex override. Configure when the Yandex product id differs from the Bridge id.',
    },
    'payments.yandex.id': {
        text: 'Required. Yandex Games product id. Get it from the Yandex Games developer console under in-game purchases.',
    },

    // ----- Leaderboards -----
    'leaderboards': {
        text: 'List of leaderboards. Each item has a Bridge id and optional per-platform leaderboard ids.',
    },
    'leaderboards.id': {
        text: 'Required. Bridge leaderboard id you pass to the leaderboards API. Platforms reuse this id when no override is provided.',
    },
    'leaderboards.isMain': {
        text: 'Mark this entry as the default leaderboard used when no id is passed to the API.',
    },
    'leaderboards.facebook': {
        text: 'Facebook leaderboard id. Get it from the Facebook Developer dashboard.',
    },
    'leaderboards.gamesnacks': {
        text: 'GameSnacks leaderboard id. Get it from your GameSnacks developer console.',
    },
    'leaderboards.jio_games': {
        text: 'JioGames leaderboard id. Get it from your JioGames developer account.',
    },
    'leaderboards.lagged': {
        text: 'Lagged leaderboard id. Get it from your Lagged developer account.',
    },
    'leaderboards.msn': {
        text: 'MSN Games leaderboard id. Get it from your MSN Games partner contact.',
    },
    'leaderboards.qa_tool': {
        text: 'Playgama QA tool leaderboard id used for internal testing.',
    },
    'leaderboards.y8': {
        text: 'Y8 leaderboard id. Get it from your Y8 developer account.',
    },
    'leaderboards.yandex': {
        text: 'Yandex Games leaderboard id. Get it from the Yandex Games developer console under leaderboards.',
    },
    'leaderboards.youtube': {
        text: 'YouTube Playables leaderboard id. Get it from your YouTube partner contact.',
    },

    // ----- Video previews -----
    'videoPreviews': {
        text: 'YouTube Playables only: video previews shown in the bottom-right corner while the game is loading. One entry is picked at random and opens the video when clicked.',
    },
    'videoPreviews.image': {
        text: 'Required. Path to a thumbnail bundled with the game archive, e.g. video-previews/preview.png.',
    },
    'videoPreviews.videoId': {
        text: 'Required. YouTube video id opened when the preview is clicked.',
    },

    // ----- SaaS -----
    'saas': {
        text: 'Optional Playgama SaaS settings (cross-platform leaderboards, social). Get the public token from your Playgama SaaS account.',
    },
    'saas.baseUrl': {
        text: 'Override the default Playgama SaaS API base URL. Leave empty to use the production endpoint.',
    },
    'saas.publicToken': {
        text: 'Public token used to authenticate SaaS API calls. Get it from the Playgama SaaS console.',
    },
    'saas.leaderboards.platforms': {
        text: 'Platform ids on which Playgama SaaS leaderboards are used instead of the native platform leaderboards. On Playgama, SaaS is used whenever a public token is set.',
    },
    'saas.social.platforms': {
        text: 'Platform ids on which Playgama SaaS social features are used instead of the native platform ones. On Playgama, SaaS is used whenever a public token is set.',
    },
};
