var TiledChunks;
(function (TiledChunks) {
    var MapListener = (function () {
        function MapListener(_sprite, _event, _callback) {
            this.sprite = _sprite;
            this.event = _event;
            this.callback = _callback;
        }
        return MapListener;
    })();
    TiledChunks.MapListener = MapListener;
})(TiledChunks || (TiledChunks = {}));
