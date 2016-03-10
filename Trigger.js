var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var TiledChunks;
(function (TiledChunks) {
    var Trigger = (function (_super) {
        __extends(Trigger, _super);
        function Trigger(_game, _id, _x, _y) {
            this.colliders = [];
            this.id = _id;
            this.key = "TriggerSprite" + _x + "/" + _y;
            _super.call(this, _game, _x, _y);
        }
        Trigger.prototype.AddCollider = function (_collider) {
            this.colliders.push(_collider);
        };
        Trigger.prototype.HasCollider = function (_collider) {
            var c = 0;
            while (c < this.colliders.length && this.colliders[c] != _collider)
                c++;
            return c < this.colliders.length;
        };
        Trigger.prototype.RemoveCollider = function (_collider) {
            var c = 0;
            while (c < this.colliders.length && this.colliders[c] != _collider)
                c++;
            if (c < this.colliders.length)
                this.colliders.splice(c, 1);
        };
        return Trigger;
    })(Phaser.Sprite);
    TiledChunks.Trigger = Trigger;
})(TiledChunks || (TiledChunks = {}));
