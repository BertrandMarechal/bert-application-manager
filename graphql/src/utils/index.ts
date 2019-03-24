export default class Utils {
    public to(promise) {
        return promise.then(data => {
            return [null, data];
        }).catch(err => [err]);
    }
}