/**
 * Created by silver_android on 12/28/2016.
 */
module.exports.randomIntFromInterval = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1) + min);
};