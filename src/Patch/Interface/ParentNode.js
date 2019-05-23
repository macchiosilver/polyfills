/**
 * @license
 * Copyright (c) 2016 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
 */

import CustomElementInternals from '../../CustomElementInternals.js';
import {proxy as NodeProxy} from '../../Environment/Node.js';
import * as Utilities from '../../Utilities.js';

/** @typedef {!function(...(!Node|string))} */
export let PrependType;
/** @typedef {!function(...(!Node|string))} */
export let AppendType;

/**
 * @param {!CustomElementInternals} internals
 * @param {!Object} destination
 * @param {!{
 *   prepend: (PrependType|undefined),
 *   append: (AppendType|undefined),
 * }} builtIn
 */
export default function(internals, destination, builtIn) {
  /**
   * @param {PrependType|AppendType} builtInMethod
   * @return {PrependType|AppendType}
   */
  function appendPrependPatch(builtInMethod) {
    return /** @this {!Node} */ function(...nodes) {
      /**
       * A copy of `nodes`, with any DocumentFragment replaced by its children.
       * @type {!Array<!Node>}
       */
      const flattenedNodes = [];

      /**
       * Elements in `nodes` that were connected before this call.
       * @type {!Array<!Node>}
       */
      const connectedElements = [];

      for (var i = 0; i < nodes.length; i++) {
        const node = nodes[i];

        if (node instanceof Element && Utilities.isConnected(node)) {
          connectedElements.push(node);
        }

        if (node instanceof DocumentFragment) {
          for (let child = NodeProxy.firstChild(node); child; child = NodeProxy.nextSibling(child)) {
            flattenedNodes.push(child);
          }
        } else {
          flattenedNodes.push(node);
        }
      }

      builtInMethod.apply(this, nodes);

      for (let i = 0; i < connectedElements.length; i++) {
        internals.disconnectTree(connectedElements[i]);
      }

      if (Utilities.isConnected(this)) {
        for (let i = 0; i < flattenedNodes.length; i++) {
          const node = flattenedNodes[i];
          if (node instanceof Element) {
            internals.connectTree(node);
          }
        }
      }
    };
  }

  if (builtIn.prepend !== undefined) {
    Utilities.setPropertyUnchecked(destination, 'prepend', appendPrependPatch(builtIn.prepend));
  }

  if (builtIn.append !== undefined) {
    Utilities.setPropertyUnchecked(destination, 'append', appendPrependPatch(builtIn.append));
  }
};