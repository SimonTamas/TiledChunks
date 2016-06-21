module TiledChunks {

    export class Collider extends Phaser.Sprite {

        
        public r: number;
        public c: number;
        public name: string;
        public key: string;

        constructor(_game: Phaser.Game, _x: number, _y: number, _key?: string, _frame?: number | string, _r?: number, _c?: number) {


            super(_game, _x, _y, _key, _frame);

            this.key = "ColliderSprite" + _x + "/" + _y;    
            this.r = _r;
            this.c = _c;

        }
    }

}