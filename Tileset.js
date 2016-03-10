var TiledChunks;
(function (TiledChunks) {
    var Tileset = (function () {
        function Tileset(_name, _textureKey) {
            this.name = _name;
            this.textureKey = _textureKey;
        }
        Tileset.prototype.GetFrameFromId = function (_id) {
            return _id - this.fromID;
        };
        Tileset.prototype.GetPropertyValueFromId = function (_id, _property) {
            var properties = this.GetPropertiesFromId(_id);
            return properties && properties[_property] || "";
        };
        Tileset.prototype.GetPropertiesFromId = function (_id) {
            return this.properties && this.properties[this.GetFrameFromId(_id)];
        };
        return Tileset;
    })();
    TiledChunks.Tileset = Tileset;
})(TiledChunks || (TiledChunks = {}));
