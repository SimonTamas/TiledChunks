module TiledChunks {
    

    export class ChunkCoord {

        row: number;
        column: number;

        public GetKey(): string
        {
            return this.row + "-" + this.column;
        }

        constructor(_row:number, _column:number) {
            this.row = _row;
            this.column = _column;
        }

    }

}