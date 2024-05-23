from django.db import models
import math
from django.contrib.auth.hashers import make_password, check_password


class PosIntegerOrInfinityField(models.PositiveIntegerField):
    def get_prep_value(self, value):
        if value is None:
            return value
        if value==math.inf:
            return 0
        value = super().get_prep_value(value)
        value+=1
        return value
    def from_db_value(self, value, *args, **kwargs):
        if value is None:
            return value
        if value==0:
            return math.inf
        else:
            return value-1


def isInfinity(float):
    return float == math.inf


# quota in kilobytes
class Domain(models.Model):
    name = models.CharField(unique=True)

    dkim_selector = models.CharField()
    dkim_key_size = models.IntegerField()
    dkim = models.CharField() # dns record
    dkim_public = models.CharField()
    dkim_dns_zone_file = models.CharField()
    dkim_private = models.CharField()

    quota = PosIntegerOrInfinityField()
    max_mailbox_quota = PosIntegerOrInfinityField()

    max_mailboxes = PosIntegerOrInfinityField()
    max_aliases = PosIntegerOrInfinityField()




    def get_mailbox_quota_consumption_sum(self, exclude_mailbox=None):
        sum = 0
        for mailbox in self.mail_boxes.all():
            if not isInfinity(mailbox):
                # print(mailbox != exclude_mailbox)
                if (exclude_mailbox is None or mailbox != exclude_mailbox):
                    sum += mailbox.quota
        return sum
    def get_mailbox_quota_consumption_left(self, exclude_mailbox=None):
        mailbox_quota_consumption_sum = self.get_mailbox_quota_consumption_sum(exclude_mailbox=exclude_mailbox)
        return self.quota - mailbox_quota_consumption_sum
    class Meta:
        ordering = ["name"]
        verbose_name = "Domain"
        verbose_name_plural = "Domains"


class MailBox(models.Model):
    fullname = models.CharField()
    username = models.CharField()

    password = models.CharField(max_length=128)
    set_password = lambda self, raw_password: setattr(self, "password", make_password(raw_password))
    check_password = lambda self, raw_password: check_password(raw_password, self.password)

    domain = models.ForeignKey(Domain, on_delete=models.CASCADE, related_name="mail_boxes")

    quota = PosIntegerOrInfinityField()

    def get_max_mailbox_quota(self, exclude=True):
        exclude_mailbox = self
        if exclude is False: exclude_mailbox = None
        mailbox_quota_consumption_left = self.domain.get_mailbox_quota_consumption_left(exclude_mailbox=exclude_mailbox)
        return min(self.domain.max_mailbox_quota, mailbox_quota_consumption_left)

    def __str__(self):
        return f"{self.username}@{self.domain.name}"
    class Meta:
        ordering = ["username"]
        verbose_name = "Mailbox"
        verbose_name_plural = "Mailboxes"
