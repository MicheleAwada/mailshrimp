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
