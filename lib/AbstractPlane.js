//
// AbstractPlane
//
// A AbstractPlane represents a coordinate system. It includes
// methods to transform the system.
//
// Note: In v3 and in alpha stages of v4 there was
//   AbstractPlane and SpaceTransformer that were then
//   merged together to form the new AbstractPlane.
//   The initial reason for this was to have an abstract
//   prototype for the non-transformable Space. However,
//   it is simpler to override transforming methods in
//   Space than have an extra abstract prototype.
//
var ITransform = require('./geom/ITransform')
var IVector = require('./geom/IVector')
var Vector = require('./geom/Vector')
var Transform = require('./geom/Transform')
var AbstractNode = require('./AbstractNode')
var extend = require('extend')

var AbstractPlane = function () {
  // A coordinate plane in space
  //
  AbstractNode.call(this)

  // Coordinate transformation.
  // The transformation from the plane to the parent (space).
  // See 2016-03-05-09
  //
  // Let:
  //   x_space, a point in space
  //   x_plane, a point on the plane.
  //   T, the coordinate transformation of the plane
  // Then:
  //   x_space = T * x_plane
  //
  // For Space, it is obviously the identity transform:
  //   x_space = T * x_space
  this._T = Transform.IDENTITY // identity transformation

  this.on('removed', function (self, newParent, oldParent) {
    // Ensure that a root node has only a identity transformation.
    // If AbstractNode was just moved to a new parent, preserve
    // local transformation.
    //
    // Dev. notes:
    //   Should we maintain global location?
    //   Why? To make it easy to attach to view temporarily.
    //   On the other hand, same relative location would be convenient
    //   when moving subelements from group to another.
    //   Would it be easier to do explicitly:
    //     gt = taa.getGlobalTransform()
    //     taa.setParent(foo)
    //     taa.setGlobalTransform(gt)
    //   Yes it would. Therefore, do not maintain global location!

    if (typeof oldParent === 'undefined') { oldParent = null }
    if (typeof newParent === 'undefined') { newParent = null }

    if (newParent === null) {
      // Root nodes cannot be moved.
      //
      // Previously .resetTransform call was used but it unnecessarily
      // emitted 'transformed' event.
      this._T = Transform.IDENTITY
    } else {
      // Assert: removed from null parent?
      if (oldParent === null) {
        throw new Error('Could not be removed from null parent')
      }
    }
  })
}

var p = extend({}, AbstractNode.prototype)
AbstractPlane.prototype = p

p.at = function (x, y) {
  // Get a IVector at the (x, y) on the plane. Alternatively,
  // takes in a Vector.
  //
  // Parameters
  //   x
  //     Number
  //   y
  //     Number
  // OR
  //   vec
  //     Vector
  //
  // Return
  //   IVector
  //
  if (typeof x === 'object' && typeof y === 'undefined') {
    // x is Vector
    return new IVector(x, this)
  }

  if (typeof x !== 'number' && typeof y !== 'number') {
    // DEBUG TODO remove the check
    throw new Error('Invalid Vector')
  }

  return new IVector(new Vector(x, y), this)
}

p.getGlobalLocalTransform = function () {
  // Get the local transformation from the plane to the parent
  // so that its global effect is captured. For example,
  // if the local translation is a translation of 10 units,
  // and the parent is a 100x scaled plane, then
  // the effect of the translation is 1000 units on the space.
  // This method preserves this effect unlike getLocalTransform
  // that preserves only the local effect.
  //
  if (this._parent === null) {
    return ITransform.IDENTITY
  }
  return new ITransform(this._T, this._parent)
}

p.getGlobalTransform = function () {
  // Get a transformation from the plane to the space as ITransform.
  //
  // Return:
  //   ITransform
  //     Transformation from the plane to root i.e. space.
  //
  // Dev note:
  //   Local transformations go like:
  //     xy_parent = T_plane * xy_plane
  //     xy_parent_parent = T_parent * xy_parent
  //     ...
  //     xy_root = T_parent_parent..._parent * xy_parent_parent..._parent
  //   Therefore global transformation is:
  //     xy_root = T_parent_..._parent * ... * T_parent * T_plane * xy_plane
  //
  var T, plane

  T = Transform.IDENTITY
  plane = this

  // As long as the plane is not root
  while (plane._parent !== null) {
    T = plane._T.multiplyRight(T)
    plane = plane._parent
  }

  // plane._parent === null, hence plane is the root.
  return new ITransform(T)
}

p.getLocalTransform = function () {
  // Local coordinate transform from plane to parent,
  // returned as ITransform as if parent is space.
  //
  // Return
  //   ITransform
  //
  // Note:
  //   returns transformation from plane to parent, i.e.
  //     xy_parent = T * xy_plane
  //
  // Design decision about the transform reference plane
  //   The returned ITransform contains the Transform from the plane
  //   to its parent without any regard on the global effect of the transform.
  //   For example
  //   a local translation of 10 screen pixels
  //   on a 100x upscaled plane
  //   yields an ITransform that translates 0.1 screen pixels
  //   on the Space plane.
  //   An alternative option was that the effect stays same.
  //   E.g. the ITransform still translates 10 screen pixels
  //   on the Space plane. This option was then implemented by
  //   getGlobalLocalTransform.
  //
  // This method is needed for example if we want to store
  // space transformer's local position for later use. In the following
  // example, a SpacePixel is moved at the same position with another.
  //   let px, py be SpacePixel instances
  //     that have been moved differently but have same parent.
  //   var lt = px.getLocalTransform()
  //   py.setLocalTransform(lt)
  //   Now px and py are positioned similarly.
  //
  // Old notes from v3:
  //   An alternative would have been to graft to the parent's coords:
  //     return new SpaceTransform(this._parent, this._T);
  //   This is kind of equivalent because:
  //     this_T_on_plane = this_T * this_T * inv(this_T) = this_T
  //   However, it is more natural if getLocalTransform is represented on
  //   the local coord system.
  //
  return new ITransform(this._T)
}

p.resetTransform = function () {
  // Reset transform to identity.
  this._T = Transform.IDENTITY
  this.emit('transformed', this)

  return this
}

p.setGlobalLocalTransform = function (itr) {
  // Set the transformation of the plane so that the global effect of
  // the transform stays the same regardless of the ancestors.
  // For example, if you have multiple planes with different ancestors, but
  // want the planes be visually double in size, you can call
  // setGlobalLocalTransform with 2x scaling for each plane.
  //
  // Parameters:
  //   itr
  //     ITransform
  //
  // Returns:
  //   this
  //     Because chainable
  //

  // If we are root, cannot set.
  if (this._parent === null) { return }

  this._T = itr.to(this._parent)
  this.emit('transformed', this)

  return this
}

p.setGlobalTransform = function (itr) {
  // Set local transform so that the global transform of the plane becomes
  // equal to the given ITransform. For example, let T be 2x scaling
  // and P a SpacePixel on a 100x upscaled plane. Then P.setGlobalTransform(T)
  // updates P's local transform to 0.02x scaling.
  //
  // Dev note:
  //   Let T be coord. transf. from the plane to root (space).
  //   So is this._T.
  //   current_glob_trans = parent_glob_trans * this_T
  //
  //   new_glob_trans = parent_glob_trans * X
  //   <=> X = inv(parent_glob_trans) * new_glob_trans
  //

  // If we are root, cannot set.
  if (this._parent === null) { return }

  // pgt is mapping from the plane to space.
  var pgt = this._parent.getGlobalTransform().toSpace()
  this._T = pgt.inverse().multiplyBy(itr.toSpace())

  this.emit('transformed', this)

  return this
}

p.setLocalTransform = function (itr) {
  // Set the transformation of the plane, relative to its parent.
  // If the ancestors together cause 100x scaling and the given transform
  // represents 0.01x scaling, the global transformation becomes the identity.

  // If you want the equal
  // effect regardless the ancestors, use setGlobalLocalTransform.
  //
  // This method is needed when we whan to restore stored position,
  // maybe after modification.
  //
  // Parameters:
  //   itr
  //     ITransform
  //

  // If we are root, cannot set.
  if (this._parent === null) { return }

  this._T = itr.toSpace()
  this.emit('transformed', this)
}

p.snap = function (pivot, igrid) {
  // Snap the plane to the given IGrid at pivot
  //
  // Parameters
  //   pivot
  //     IVector
  //   igrid
  //     IGrid
  //
  // Emits
  //   transformed
  //
  // Return
  //   this
  //
  // Dev. note
  //   The same can be done with IGrid with:
  //   var itr =  new ITransform(this._T, this._parent)
  //   this._T = igrid.snap(pivot, itr).to(this._parent)
  //

  // If we are root, cannot snap.
  if (this._parent === null) { return }

  this._T = igrid.to(this._parent).snap(pivot.to(this), this._T)
  this.emit('transformed', this)
  return this
}

p.transformBy = function (itr, plane) {
  // Apply an ITransform to the node's local transform.
  // By default, itr is first represented on the parent's coordinate plane.
  // If you want to apply the effect the itr has on another plane,
  // you can specify the plane.
  //
  // Parameters:
  //   itr
  //     ITransform
  //   plane
  //     Optional AbstractPlane. Default to the parent plane. Provide if
  //     you want to apply the effect the itr has on a plane
  //     different from the parent. Null equals space.
  //
  // Emits:
  //   transformed
  //
  // Return:
  //   this
  //     To make chainable
  //

  // If we are root, cannot set.
  if (this._parent === null) { return }

  if (typeof plane === 'undefined') {
    plane = this._parent
  }

  this._T = itr.to(plane).multiplyRight(this._T)
  this.emit('transformed', this)

  return this
}

p.translate = function (domain, range) {
  // Move plane horizontally and vertically by example.
  //
  // Translate the plane so that after the translation, the domain points
  // would be as close to given range points as possible.
  //
  // Parameters: see ITransform.prototype.translate
  var st = ITransform.estimate('T', domain, range)
  return this.transformBy(st)
}

p.scale = function (pivot, multiplierOrDomain, range) {
  // Parameters: see ITransform.prototype.scale
  var st = ITransform.IDENTITY.scale(pivot, multiplierOrDomain, range)
  return this.transformBy(st)
}

p.rotate = function (pivot, radiansOrDomain, range) {
  // Parameters: see ITransform.prototype.rotate
  var st = ITransform.IDENTITY.rotate(pivot, radiansOrDomain, range)
  return this.transformBy(st)
}

p.translateScale = function (domain, range) {
  // Parameters: see ITransform.prototype.translateScale
  var st = ITransform.estimate('TS', domain, range)
  return this.transformBy(st)
}

p.translateRotate = function (domain, range) {
  // Parameters: see ITransform.prototype.translateRotate
  var st = ITransform.estimate('TR', domain, range)
  return this.transformBy(st)
}

p.scaleRotate = function (pivot, domain, range) {
  // Parameters: see ITransform.prototype.scaleRotate
  var st = ITransform.estimate('SR', domain, range, pivot)
  return this.transformBy(st)
}

p.translateScaleRotate = function (domain, range) {
  // Parameters: see ITransform.prototype.translateScaleRotate
  var st = ITransform.estimate('TSR', domain, range)
  return this.transformBy(st)
}

module.exports = AbstractPlane
