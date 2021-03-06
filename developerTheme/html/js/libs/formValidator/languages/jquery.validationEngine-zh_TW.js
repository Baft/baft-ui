tderr: '%s'" % (self.cmd, self.returncode,
                                                                             self.stdout, self.stderr)

class BlackboxTestCase(TestCase):
    """Base test case for blackbox tests."""

    def _make_cmdline(self, line):
        bindir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../../bin"))
        parts = line.split(" ")
        if os.path.exists(os.path.join(bindir, parts[0])):
            parts[0] = os.path.join(bindir, parts[0])
        line = " ".join(parts)
        return line

    def check_run(self, line):
        line = self._make_cmdline(line)
        p = subprocess.Popen(line, stdout=subprocess.PIPE, stderr=subprocess.PIPE, shell=True)
        retcode = p.wait()
        if retcode:
            raise BlackboxProcessError(retcode, line, p.stdout.read(), p.stderr.read())

    def check_output(self, line):
        line = self._make_cmdline(line)
        p = subprocess.Popen(line, stdout=subprocess.PIPE, stderr=subprocess.PIPE, shell=True, close_fds=True)
        retcode = p.wait()
        if retcode:
            raise BlackboxProcessError(retcode, line, p.stdout.read(), p.stderr.read())
        return p.stdout.read()

def connect_samdb(samdb_url, lp=None, session_info=None, credentials=None,
                  flags=0, ldb_options=None, ldap_only=False):
    """Create SamDB instance and connects to samdb_url database.

    :param samdb_url: Url for database to connect to.
    :param lp: Optional loadparm object
    :param session_info: Optional session information
    :param credentials: Optional credentials, defaults to anonymous.
    :param flags: Optional LDB flags
    :param ldap_only: If set, only remote LDAP connection will be created.

    Added value for tests is that we have a shorthand function
    to make proper URL for ldb.connect() while using default
    parameters for connection based on test environment
    """
    samdb_url = samdb_url.lower()
    if not "://" in samdb_url:
        if not ldap_only and os.path.isfile(samdb_url):
            samdb_url = "tdb://%s" % samdb_url
        else:
            samdb_url = "ldap://%s" % samdb_url
    # use 'paged_search' module when connecting remotely
    if samdb_url.startswith("ldap://"):
        ldb_options = ["modules:paged_searches"]
    elif ldap_only:
        raise AssertionError("Trying to connect to %s while remote "
                             "connection is required" % samdb_url)

    # set defaults for test environment
    if lp is None:
        lp = env_loadparm()
    if session_info is None:
        session_info = samba.auth.system_session(lp)
    if credentials is None:
        credentials = cmdline_credentials

    return SamDB(url=samdb_url,
                 lp=lp,
                 session_info=session_info,
                 credentials=credentials,
                 flags=flags,
                 options=ldb_options)


def connect_samdb_ex(samdb_url, lp=None, session_info=None, credentials=None,
                     flags=0, ldb_options=None, ldap_only=False):
    """Connects to samdb_url database

    :param samdb_url: Url for database to connect to.
    :param lp: Optional loadparm object
    :param session_info: Optional session information
    :param credentials: Optional credentials, defaults to anonymous.
    :param flags: Optional LDB flags
    :param ldap_only: If set, only remote LDAP connection will be created.
    :return: (sam_db_connection, rootDse_record) tuple
    """
    sam_db = connect_samdb(samdb_url, lp, session_info, credentials,
                           flags, ldb_options, ldap_only)
    # fetch RootDse
    res = sam_db.search(base="", expression="", scope=ldb.SCOPE_BASE,
                        attrs=["*"])
    return (sam_db, res[0])


def delete_force(samdb, dn):
    try:
        samdb.delete(dn)
    except ldb.LdbError, (num, _):
        assert(num == ldb.ERR_NO_SUCH_OBJECT)
                                                                                                                                                                                    # Unix SMB/CIFS implementation.
# Copyright (C) Jelmer Vernooij <jelmer@samba.org> 2007
#
# This program is free software; you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation; either version 3 of the License, or
# (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with this program.  If not, see <http://www.gnu.org/licenses/>.
#

"""Tests for the Auth Python bindings.

Note that this just tests the bindings work. It does not intend to test
the functionality, that's already done in other tests.
"""

from samba import auth
import samba.tests

class AuthTests(samba.tests.TestCase):

    def test_system_session(self):
        auth.system_session()

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        # Unix SMB/CIFS implementation. Tests for common.py routines
# Copyright (C) Andrew Tridgell 2011
#
# This program is free software; you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation; either version 3 of the License, or
# (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with this program.  If not, see <http://www.gnu.org/licenses/>.
#

"""Tests for samba.common"""

import samba, os
import samba.tests
from samba.common import *
from samba.samdb import SamDB


class CommonTests(samba.tests.TestCase):

    def test_normalise_int32(self):
        self.assertEquals('17', normalise_int32(17))
        self.assertEquals('17', normalise_int32('17'))
        self.assertEquals('-123', normalise_int32('-123'))
        self.assertEquals('-1294967296', normalise_int32('3000000000'))

    def test_dsdb_Dn(self):
        sam = samba.Ldb(url='dntest.ldb')
        dn1 = dsdb_Dn(sam, "DC=foo,DC=bar")
        dn2 = dsdb_Dn(sam, "B:8:0000000D:<GUID=b3f0ec29-17f4-452a-b002-963e1909d101>;DC=samba,DC=example,DC=com")
        self.assertEquals(dn2.binary, "0000000D")
        self.assertEquals(13, dn2.get_binary_integer())
        os.unlink('dntest.ldb')
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 