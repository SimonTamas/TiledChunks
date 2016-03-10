var TiledChunks;
(function (TiledChunks) {
    var ChunkCoord = (function () {
        function ChunkCoord(_row, _column) {
            this.row = _row;
            this.column = _column;
        }
        ChunkCoord.prototype.GetKey = function () {
            return this.row + "-" + this.column;
        };
        return ChunkCoord;
    })();
    TiledChunks.ChunkCoord = ChunkCoord;
})(TiledChunks || (TiledChunks = {}));
