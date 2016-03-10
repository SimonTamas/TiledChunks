var TiledChunks;
(function (TiledChunks) {
    var MapLayer = (function () {
        function MapLayer(_container, _data) {
            this.container = _container;
            this.data = _data;
        }
        return MapLayer;
    })();
    TiledChunks.MapLayer = MapLayer;
})(TiledChunks || (TiledChunks = {}));
