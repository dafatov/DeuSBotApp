const timeFormat = (function (){
    function num(val){
        val = Math.floor(val);
        return val < 10 ? '0' + val : val;
    }

    return function (sec){
        var 
           hours = sec / 3600  % 24
          , minutes = sec / 60 % 60
          , seconds = sec % 60
        ;

        return num(hours) + ":" + num(minutes) + ":" + num(seconds);
    };
})();

module.exports.timeFormat = (s) => {
    let time = new Date(0, 0, 0, 0, 0, s);
    
    return time.toLocaleTimeString();
}