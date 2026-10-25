/** Shared, deterministic input for the public extraction Tool compatibility tests. */
export const resourceHtml = `<head><base href="https://ignored.test/base/"></head><body>
<a>missing</a><a href=""> empty </a>
<a href="../page" title="First"> First <b>link</b> </a>
<a href="https://other.test/path" title=""> Absolute </a>
<a href="http://[invalid"> Invalid </a><a href="../page"> Duplicate </a>
<img alt="missing"><img src="" alt="" title="" width="" height="">
<img src="../photo.png" alt="Photo" title="Portrait" width="20" height="30">
<img src="https://other.test/photo.png"><img src="http://[invalid"><img src="../photo.png">
</body>`;

export const elementHtml =
  '<main><p class="item" data-value="yes" data-empty="">  First <b>bold</b> </p><p class="item"> Second &amp; last </p><div class="empty"></div><img class="void" src="x"></main>';
