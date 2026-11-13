"""Copy a coherent macOS clone of inherited reader fd3 to anonymous target fd4.

No original path, native session API, transcript output or provider operation.
Exit 66 means the optional OS clone primitive is unavailable before target writes.
"""
import ctypes
import errno
import os
import stat
import sys


def capture():
    library = ctypes.CDLL(None, use_errno=True)
    clone = getattr(library, 'fclonefileat', None)
    if clone is None:
        return 66
    clone.argtypes = [ctypes.c_int, ctypes.c_int, ctypes.c_char_p, ctypes.c_uint32]
    clone.restype = ctypes.c_int
    destination = sys.argv[1]
    if not stat.S_ISREG(os.fstat(3).st_mode) or not stat.S_ISREG(os.fstat(4).st_mode):
        return 65
    if clone(3, -2, os.fsencode(destination), 0):  # AT_FDCWD on macOS
        code = ctypes.get_errno()
        if code in (errno.ENOSYS, errno.ENOTSUP, errno.EXDEV):
            return 66
        return 65
    try:
        source = os.open(destination, os.O_RDONLY | os.O_NOFOLLOW)
        try:
            os.unlink(destination)
            while True:
                chunk = os.read(source, 1024 * 1024)
                if not chunk:
                    break
                remaining = memoryview(chunk)
                while remaining:
                    written = os.write(4, remaining)
                    if not written:
                        return 65
                    remaining = remaining[written:]
        finally:
            os.close(source)
    finally:
        if os.path.lexists(destination):
            os.unlink(destination)
    return 0


try:
    sys.exit(capture())
except Exception:
    # Private file names and transcript bytes never become worker/tool output.
    sys.exit(65)
