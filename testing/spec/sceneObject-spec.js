/*global describe, it, expect, geo*/
describe('geo.sceneObject', function() {
  function CallCounter(extraData) {
    var m_this = this;
    this.ncalls = 0;
    this.call = function (evtData) {
      if (extraData !== null) {
        expect(evtData).toBe(extraData);
      }
      m_this.ncalls++;
    };
  }
  describe('Check tree operators', function () {
    it('addChild', function () {
      var parent = new geo.sceneObject(),
          children = [
            new geo.sceneObject(),
            new geo.sceneObject(),
            new geo.sceneObject()
          ];
      children.forEach(function (child) {
        parent.addChild(child);
      });
      
      expect(parent.parent()).toBe(null);
      parent.children().forEach(function (child, idx) {
        expect(child).toBe(children[idx]);
        expect(child.parent()).toBe(parent);
        expect(child.children().length).toBe(0);
      });
    });
  });
});
