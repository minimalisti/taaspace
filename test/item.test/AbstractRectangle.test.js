var taaspace = require('../../index')
var Space = taaspace.Space
var SpaceView = taaspace.SpaceView
var SpacePixel = taaspace.SpacePixel
var Vector = taaspace.geom.Vector

module.exports = function (test) {
  test('should have an id', function (t) {
    var space = new Space()
    var a = new SpacePixel(space)
    var b = new SpacePixel(space)
    t.equal(typeof a.id, 'string')
    t.equal(typeof b.id, 'string')
    t.notEqual(a.id, b.id)
    t.end()
  })

  test('should be removable', function (t) {
    var space = new Space()
    var a = new SpacePixel(space)
    a.remove()
    t.equal(space._children.hasOwnProperty(a.id), false, 'removed ok')
    t.end()
  })

  test('should be able to return a IVector', function (t, ctx) {
    var space = new Space()
    var view = new SpaceView(space)
    view.mount(ctx.container)

    var a = new SpacePixel(space)
    var p = a.atNorm(1, 1)
    var vp = p.to(view)
    t.equal(vp.x, 1)
    t.equal(vp.y, 1)
    t.end()
  })

  test('should be able to give and take Transform objects', function (t) {
    var space = new Space()
    var px = new SpacePixel(space)

    // Move to to unit square.
    px.translateScale(
      [px.atNW(), px.atSE()],
      [space.at(-10, -10), space.at(10, 10)]
    )
    // Store position
    var lt = px.getLocalTransform()

    // Rotate 1/2π radians
    var rt = lt.rotate(space.at(0, 0), 1)
    px.setLocalTransform(rt)

    // Ensure movement
    var se = px.atSE().to(space)
    t.notEqual(se.x, 10, 'corner moved')
    t.notEqual(se.y, 10, 'corner moved')

    // Revert back
    px.setLocalTransform(lt)

    // Ensure
    var seb = px.atSE().to(space)
    t.equal(seb.x, 10, 'corner back')
    t.equal(seb.y, 10, 'corner back')
    t.end()
  })

  test('#fitScale squares', function (t) {
    var space = new Space()

    var px1 = new SpacePixel(space)
    var px2 = new SpacePixel(space)

    px2.scale(px2.atMid(), 7)
    px2.fitScale(px1)

    t.ok(px2.getHull().equals(px1.getHull()), 'hulls equal')
    t.end()
  })

  test('#fitScale rectangles', function (t) {
    //
    //   +--------------+
    //   |        px1   |
    //   ++------------++
    //   ||    px2     ||
    //   ++------------++
    //   |              |
    //   +--------------+
    //
    var space = new Space()

    var px1 = new SpacePixel(space)
    var px2 = new SpacePixel(space)

    px2.setLocalSize(new Vector(2, 1))
    px2.fitScale(px1)

    var h2 = px2.getHull().toSpace()

    t.ok(h2.get(0).equals(new Vector(-0.5, 0)), 'correct NW')
    t.ok(h2.get(1).equals(new Vector(-0.5, 1)), 'correct SW')
    t.ok(h2.get(2).equals(new Vector(1.5, 1)), 'correct SE')
    t.ok(h2.get(3).equals(new Vector(1.5, 0)), 'correct NE')
    t.end()
  })

  test('#fitSize', function (t) {
    var space = new Space()

    var px1 = new SpacePixel(space)
    var px2 = new SpacePixel(space)

    // Fit px2's size to upscaled px1
    px1.scale(px1.atNW(), 4)
    px2.fitSize(px1)

    t.ok(px1.getLocalSize().equals(new Vector(1, 1)), 'only scaled')
    t.ok(px2.getLocalSize().equals(new Vector(4, 4)), 'only resized')
    t.end()
  })
}
