"use strict";
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FishPlayer = void 0;
var config = require("./config");
var api = require("./api");
var FishPlayer = /** @class */ (function () {
    function FishPlayer(_a, player) {
        var name = _a.name, _b = _a.muted, muted = _b === void 0 ? false : _b, _c = _a.mod, mod = _c === void 0 ? false : _c, _d = _a.admin, admin = _d === void 0 ? false : _d, _e = _a.member, member = _e === void 0 ? false : _e, _f = _a.stopped, stopped = _f === void 0 ? false : _f, _g = _a.highlight, highlight = _g === void 0 ? null : _g, _h = _a.history, history = _h === void 0 ? [] : _h, _j = _a.rainbow, rainbow = _j === void 0 ? null : _j;
        var _k;
        //Transients
        this.player = null;
        this.pet = "";
        this.watch = false;
        this.activeMenu = { cancelOptionId: -1 };
        this.afk = false;
        this.tileId = false;
        this.tilelog = false;
        this.trail = null;
        this.name = (_k = name !== null && name !== void 0 ? name : player.name) !== null && _k !== void 0 ? _k : "Unnamed player [ERROR]";
        this.muted = muted;
        this.mod = mod;
        this.admin = admin;
        this.member = member;
        this.stopped = stopped;
        this.highlight = highlight;
        this.history = history;
        this.player = player;
        this.rainbow = rainbow;
    }
    FishPlayer.read = function (fishPlayerData, player) {
        return new this(JSON.parse(fishPlayerData), player);
    };
    FishPlayer.createFromPlayer = function (player) {
        return new this({
            name: player.name,
            muted: false,
            mod: false,
            admin: false,
            member: false,
            stopped: false,
            highlight: null,
            history: []
        }, player);
    };
    FishPlayer.createFromInfo = function (playerInfo) {
        return new this({
            name: playerInfo.lastName,
            muted: false,
            mod: false,
            admin: false,
            member: false,
            stopped: false,
            highlight: null,
            history: []
        }, null);
    };
    FishPlayer.getFromInfo = function (playerInfo) {
        var _a;
        return (_a = this.cachedPlayers[playerInfo.id]) !== null && _a !== void 0 ? _a : this.createFromInfo(playerInfo);
    };
    FishPlayer.get = function (player) {
        var _a;
        return (_a = this.cachedPlayers[player.uuid()]) !== null && _a !== void 0 ? _a : this.createFromPlayer(player);
    };
    FishPlayer.getById = function (id) {
        var _a;
        return (_a = this.cachedPlayers[id]) !== null && _a !== void 0 ? _a : null;
    };
    FishPlayer.getByName = function (name) {
        var realPlayer = Groups.player.find(function (p) {
            return p.name === name ||
                p.name.includes(name) ||
                p.name.toLowerCase().includes(name.toLowerCase()) ||
                Strings.stripColors(p.name).toLowerCase() === name.toLowerCase() ||
                Strings.stripColors(p.name).toLowerCase().includes(name.toLowerCase()) ||
                false;
        });
        return this.get(realPlayer);
    };
    ;
    FishPlayer.onPlayerJoin = function (player) {
        var fishPlayer;
        if (this.cachedPlayers[player.uuid()]) {
            fishPlayer = this.cachedPlayers[player.uuid()];
            fishPlayer.updateSavedInfoFromPlayer(player);
        }
        else {
            fishPlayer = this.createFromPlayer(player);
        }
        fishPlayer.checkName();
        fishPlayer.updateName();
        api.getStopped(player.uuid(), function (stopped) {
            if (fishPlayer.stopped && !stopped)
                fishPlayer.free("api");
            if (stopped)
                fishPlayer.stop("api");
        });
    };
    FishPlayer.forEachPlayer = function (func) {
        var e_1, _a;
        try {
            for (var _b = __values(Object.entries(this.cachedPlayers)), _c = _b.next(); !_c.done; _c = _b.next()) {
                var _d = __read(_c.value, 2), uuid = _d[0], player = _d[1];
                if (player.player && !player.player.con.hasDisconnected)
                    func(player);
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_1) throw e_1.error; }
        }
    };
    FishPlayer.prototype.write = function () {
        return JSON.stringify({
            name: this.name,
            muted: this.muted,
            mod: this.mod,
            admin: this.admin,
            member: this.member,
            stopped: this.stopped,
            highlight: this.highlight,
            history: this.history
        });
    };
    /**Must be called at player join, before updateName(). */
    FishPlayer.prototype.updateSavedInfoFromPlayer = function (player) {
        this.player = player;
        this.name = player.name;
        //this.cleanedName = Strings.stripColors(player.name);
    };
    FishPlayer.prototype.updateName = function () {
        if (this.player == null)
            return; //No player, no need to update
        var prefix = '';
        if (this.stopped)
            prefix += config.STOPPED_PREFIX;
        if (this.muted)
            prefix += config.MUTED_PREFIX;
        if (this.afk)
            prefix += config.AFK_PREFIX;
        if (this.member)
            prefix += config.MEMBER_PREFIX;
        if (this.admin)
            prefix += config.ADMIN_PREFIX;
        else if (this.mod)
            prefix += config.MOD_PREFIX;
        this.player.name = prefix + this.name;
    };
    /**
     * Record moderation actions taken on a player.
     * @param id uuid of the player
     * @param entry description of action taken
     */
    FishPlayer.prototype.addHistoryEntry = function (entry) {
        if (this.history.length > FishPlayer.maxHistoryLength) {
            this.history.shift();
        }
        this.history.push(entry);
    };
    FishPlayer.addPlayerHistory = function (id, entry) {
        var _a;
        (_a = this.getById(id)) === null || _a === void 0 ? void 0 : _a.addHistoryEntry(entry);
    };
    FishPlayer.prototype.stop = function (by) {
        this.stopped = true;
        this.player.unit().type = UnitTypes.stell;
        this.updateName();
        this.player.sendMessage("[scarlet]Oopsy Whoopsie! You've been stopped, and marked as a griefer.");
        if (by instanceof FishPlayer) {
            this.addHistoryEntry({
                action: 'stopped',
                by: by.name,
                time: Date.now(),
            });
            api.addStopped(this.player.uuid());
        }
        FishPlayer.saveAll();
    };
    FishPlayer.prototype.free = function (by) {
        if (!this.stopped)
            return;
        this.stopped = false;
        this.player.unit().type = UnitTypes.alpha;
        this.updateName();
        if (by instanceof FishPlayer) {
            this.player.sendMessage('[yellow]Looks like someone had mercy on you.');
            this.addHistoryEntry({
                action: 'freed',
                by: by.name,
                time: Date.now(),
            });
            api.free(this.player.uuid());
        }
        FishPlayer.saveAll();
    };
    FishPlayer.prototype.checkName = function () {
        var e_2, _a;
        try {
            for (var _b = __values(config.bannedNames), _c = _b.next(); !_c.done; _c = _b.next()) {
                var bannedName = _c.value;
                if (this.name.toLowerCase().includes(bannedName)) {
                    this.player.kick("[scarlet]\"".concat(this.name, "[scarlet]\" is not an allowed name.\n\nIf you are unable to change it, please download Mindustry from Steam or itch.io."));
                }
            }
        }
        catch (e_2_1) { e_2 = { error: e_2_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_2) throw e_2.error; }
        }
    };
    FishPlayer.saveAll = function () {
        var e_3, _a;
        //Temporary implementation
        var jsonString = "{";
        try {
            for (var _b = __values(Object.entries(this.cachedPlayers)), _c = _b.next(); !_c.done; _c = _b.next()) {
                var _d = __read(_c.value, 2), uuid = _d[0], player = _d[1];
                if (player.admin || player.mod || player.member)
                    jsonString += "\"".concat(uuid, "\":").concat(player.write());
            }
        }
        catch (e_3_1) { e_3 = { error: e_3_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_3) throw e_3.error; }
        }
        jsonString += "}";
        Core.settings.put('fish', jsonString);
        Core.settings.manualSave();
    };
    FishPlayer.loadAll = function () {
        var e_4, _a;
        //Temporary implementation
        var jsonString = Core.settings.get('fish', '');
        if (jsonString == "")
            return;
        try {
            for (var _b = __values(Object.entries(JSON.parse(jsonString))), _c = _b.next(); !_c.done; _c = _b.next()) {
                var _d = __read(_c.value, 2), key = _d[0], value = _d[1];
                this.cachedPlayers[key] = new this(value, null);
            }
        }
        catch (e_4_1) { e_4 = { error: e_4_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_4) throw e_4.error; }
        }
    };
    FishPlayer.cachedPlayers = {};
    FishPlayer.maxHistoryLength = 5;
    return FishPlayer;
}());
exports.FishPlayer = FishPlayer;
